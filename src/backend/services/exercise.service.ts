import type { Exercise } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ExerciseCandidate, UserProfile } from "@/backend/types/plan.types";

const IMAGE_BASE =
  process.env.EXERCISE_IMAGE_BASE ??
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

/** Map common UI equipment labels to dataset values */
const EQUIPMENT_ALIASES: Record<string, string[]> = {
  "body only": ["body only", "null"],
  bodyweight: ["body only", "null"],
  dumbbell: ["dumbbell"],
  barbell: ["barbell", "e-z curl bar"],
  cable: ["cable"],
  machine: ["machine"],
  kettlebells: ["kettlebells"],
  bands: ["bands"],
  "medicine ball": ["medicine ball"],
  "exercise ball": ["exercise ball"],
  other: ["other", "foam roll"],
  "full gym": [
    "body only",
    "dumbbell",
    "barbell",
    "cable",
    "machine",
    "kettlebells",
    "bands",
    "medicine ball",
    "exercise ball",
    "e-z curl bar",
    "other",
    "foam roll",
  ],
};

function expandEquipment(equipment: string[]): (string | null)[] {
  const set = new Set<string | null>();
  for (const item of equipment) {
    const key = item.toLowerCase();
    const aliases = EQUIPMENT_ALIASES[key] ?? [key];
    for (const a of aliases) {
      if (a === "null") set.add(null);
      else set.add(a);
    }
  }
  return [...set];
}

export function buildImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img): img is string => typeof img === "string")
    .map((img) => `${IMAGE_BASE}/${img}`);
}

export function toCandidate(ex: Exercise): ExerciseCandidate {
  return {
    id: ex.id,
    name: ex.name,
    primaryMuscles: (ex.primaryMuscles as string[]) ?? [],
    secondaryMuscles: (ex.secondaryMuscles as string[]) ?? [],
    equipment: ex.equipment,
    mechanic: ex.mechanic,
    level: ex.level,
    category: ex.category,
  };
}

export async function filterExercisesForProfile(
  profile: UserProfile,
  limit = 60,
): Promise<ExerciseCandidate[]> {
  const allowedEquipment = expandEquipment(profile.equipment);
  const levelOrder =
    profile.level === "beginner"
      ? ["beginner"]
      : profile.level === "intermediate"
        ? ["beginner", "intermediate"]
        : ["beginner", "intermediate", "expert"];

  const rows = await prisma.exercise.findMany({
    where: {
      level: { in: levelOrder },
      category: { in: ["strength", "powerlifting", "plyometrics"] },
      OR: [
        { equipment: { in: allowedEquipment.filter((e): e is string => e !== null) } },
        ...(allowedEquipment.includes(null) ? [{ equipment: null }] : []),
      ],
    },
    take: 200,
  });

  // Prefer compound lifts and diversify by primary muscle
  const scored = rows
    .map((ex) => {
      let score = 0;
      if (ex.mechanic === "compound") score += 3;
      if (ex.level === profile.level) score += 2;
      if (ex.category === "strength") score += 1;
      return { ex, score };
    })
    .sort((a, b) => b.score - a.score);

  const byMuscle = new Map<string, typeof scored>();
  for (const item of scored) {
    const muscle = ((item.ex.primaryMuscles as string[]) ?? ["other"])[0] ?? "other";
    const list = byMuscle.get(muscle) ?? [];
    list.push(item);
    byMuscle.set(muscle, list);
  }

  const picked: Exercise[] = [];
  const muscles = [...byMuscle.keys()];
  let round = 0;
  while (picked.length < limit && round < 20) {
    for (const muscle of muscles) {
      const list = byMuscle.get(muscle);
      if (!list || list.length <= round) continue;
      picked.push(list[round].ex);
      if (picked.length >= limit) break;
    }
    round += 1;
  }

  return picked.map(toCandidate);
}

export async function getExercisesByIds(ids: string[]): Promise<Exercise[]> {
  if (ids.length === 0) return [];
  return prisma.exercise.findMany({ where: { id: { in: ids } } });
}

export async function listExercises(params: {
  level?: string;
  equipment?: string;
  muscle?: string;
  q?: string;
  limit?: number;
}): Promise<Exercise[]> {
  const limit = Math.min(params.limit ?? 40, 100);
  const where: Record<string, unknown> = {};

  if (params.level) where.level = params.level;
  if (params.equipment) {
    if (params.equipment === "body only" || params.equipment === "bodyweight") {
      where.OR = [{ equipment: "body only" }, { equipment: null }];
    } else {
      where.equipment = params.equipment;
    }
  }
  if (params.q) {
    where.name = { contains: params.q, mode: "insensitive" };
  }

  const rows = await prisma.exercise.findMany({
    where,
    take: limit * 2,
    orderBy: { name: "asc" },
  });

  if (!params.muscle) return rows.slice(0, limit);

  const muscle = params.muscle.toLowerCase();
  return rows
    .filter((ex) => {
      const primary = ((ex.primaryMuscles as string[]) ?? []).map((m) => m.toLowerCase());
      return primary.includes(muscle);
    })
    .slice(0, limit);
}
