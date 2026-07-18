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
    .filter((img): img is string => typeof img === "string" && img.length > 0)
    .map((img) =>
      img.startsWith("http://") || img.startsWith("https://")
        ? img
        : `${IMAGE_BASE}/${img}`,
    );
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

  const focusAreas = (profile.focusAreas ?? []).map((f) => f.toLowerCase());
  const limitations = new Set(
    (profile.limitations ?? []).map((l) => l.toLowerCase()).filter((l) => l !== "none"),
  );

  const rows = await prisma.exercise.findMany({
    where: {
      level: { in: levelOrder },
      category: { in: ["strength", "powerlifting", "plyometrics", "olympic weightlifting"] },
      OR: [
        { equipment: { in: allowedEquipment.filter((e): e is string => e !== null) } },
        ...(allowedEquipment.includes(null) ? [{ equipment: null }] : []),
      ],
    },
    orderBy: [{ popularity: "desc" }, { name: "asc" }],
    take: 300,
  });

  const scored = rows
    .map((ex) => {
      const primary = ((ex.primaryMuscles as string[]) ?? []).map((m) => m.toLowerCase());
      let score = ex.popularity ?? 50;
      if (ex.mechanic === "compound") score += 12;
      if (ex.level === profile.level) score += 8;
      if (ex.category === "strength") score += 5;
      if (ex.source === "free-exercise-db") score += 3;

      if (focusAreas.includes("upper") && ["chest", "back", "shoulders", "arms"].includes(ex.muscleGroup ?? "")) {
        score += 10;
      }
      if (focusAreas.includes("lower") && (ex.muscleGroup === "legs" || primary.includes("glutes"))) {
        score += 10;
      }
      if (focusAreas.includes("core") && (ex.muscleGroup === "core" || primary.includes("abdominals"))) {
        score += 10;
      }

      if (limitations.has("knees") && primary.some((m) => ["quadriceps", "hamstrings", "calves"].includes(m))) {
        score -= 8;
      }
      if (limitations.has("shoulders") && primary.includes("shoulders") && ex.mechanic === "compound") {
        score -= 15;
      }
      if (limitations.has("back") && primary.includes("lower back")) {
        score -= 20;
      }
      if (limitations.has("wrists") && /curl|extension|press/.test(ex.name.toLowerCase())) {
        score -= 5;
      }

      return { ex, score };
    })
    .sort((a, b) => b.score - a.score);

  const byMuscle = new Map<string, typeof scored>();
  for (const item of scored) {
    const muscle =
      ((item.ex.primaryMuscles as string[]) ?? ["other"])[0]?.toLowerCase() ?? "other";
    const list = byMuscle.get(muscle) ?? [];
    list.push(item);
    byMuscle.set(muscle, list);
  }

  const picked: Exercise[] = [];
  const muscles = [...byMuscle.keys()];
  let round = 0;
  while (picked.length < limit && round < 25) {
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
  muscleGroup?: string;
  q?: string;
  limit?: number;
}): Promise<Exercise[]> {
  const limit = Math.min(params.limit ?? 40, 100);
  const where: Record<string, unknown> = {};

  if (params.level) where.level = params.level;
  if (params.muscleGroup) where.muscleGroup = params.muscleGroup;
  if (params.equipment) {
    if (params.equipment === "body only" || params.equipment === "bodyweight") {
      where.OR = [{ equipment: "body only" }, { equipment: null }];
    } else {
      where.equipment = params.equipment;
    }
  }
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      ...(where.OR ? [] : []),
    ];
    // Prefer name search; also match via raw if OR already set for equipment
    if (params.equipment) {
      where.AND = [
        {
          OR: [
            { equipment: params.equipment === "bodyweight" ? "body only" : params.equipment },
            ...(params.equipment === "bodyweight" || params.equipment === "body only"
              ? [{ equipment: null }]
              : []),
          ],
        },
        { name: { contains: params.q, mode: "insensitive" } },
      ];
      delete where.OR;
      delete where.equipment;
    } else {
      where.name = { contains: params.q, mode: "insensitive" };
      delete where.OR;
    }
  }

  const rows = await prisma.exercise.findMany({
    where,
    take: limit * 2,
    orderBy: [{ popularity: "desc" }, { name: "asc" }],
  });

  if (!params.muscle) return rows.slice(0, limit);

  const muscle = params.muscle.toLowerCase();
  return rows
    .filter((ex) => {
      const primary = ((ex.primaryMuscles as string[]) ?? []).map((m) => m.toLowerCase());
      return primary.includes(muscle) || ex.muscleGroup === muscle;
    })
    .slice(0, limit);
}
