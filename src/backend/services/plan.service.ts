import type { PlanDayStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  DayWorkout,
  EnrichedDayWorkout,
  EnrichedWorkoutExercise,
  UserProfile,
} from "@/backend/types/plan.types";
import {
  buildImageUrls,
  filterExercisesForProfile,
  getExercisesByIds,
} from "./exercise.service";
import { generateDayWorkout } from "./openai-day-plan.service";
import { validateAndSanitizeWorkout } from "./plan-validation.service";
import { getDayFocus } from "./split-template.service";
import { buildWeekSkeleton, TOTAL_DAYS } from "./week-skeleton.service";

async function enrichWorkout(
  workout: DayWorkout,
  aiGenerated: boolean,
): Promise<EnrichedDayWorkout> {
  const ids = workout.exercises.map((e) => e.exerciseId);
  const rows = await getExercisesByIds(ids);
  const byId = new Map(rows.map((r) => [r.id, r]));

  const exercises: EnrichedWorkoutExercise[] = [];
  for (const item of workout.exercises) {
    const ex = byId.get(item.exerciseId);
    if (!ex) continue;
    exercises.push({
      ...item,
      name: ex.name,
      primaryMuscles: (ex.primaryMuscles as string[]) ?? [],
      secondaryMuscles: (ex.secondaryMuscles as string[]) ?? [],
      instructions: (ex.instructions as string[]) ?? [],
      imageUrls: buildImageUrls(ex.images),
      equipment: ex.equipment,
      mechanic: ex.mechanic,
    });
  }
  return {
    exercises,
    coachTip: workout.coachTip,
    aiGenerated,
  };
}

async function generateAndSaveDay(params: {
  planId: string;
  dayNumber: number;
  profile: UserProfile;
  status?: PlanDayStatus;
}) {
  const { planId, dayNumber, profile } = params;
  const focus = getDayFocus(profile, dayNumber);

  const planDay = await prisma.planDay.findUnique({
    where: { planId_dayNumber: { planId, dayNumber } },
  });
  if (!planDay) throw new Error(`Plan day ${dayNumber} not found`);

  if (focus.isRestDay) {
    const updated = await prisma.planDay.update({
      where: { id: planDay.id },
      data: {
        status: "ready",
        workout: {
          exercises: [],
          coachTip: "Rest and recover. Light walk or mobility is optional.",
          aiGenerated: false,
        },
        generatedAt: new Date(),
      },
    });
    return updated;
  }

  await prisma.planDay.update({
    where: { id: planDay.id },
    data: { status: "generating" },
  });

  const candidates = await filterExercisesForProfile(profile, 60);
  if (candidates.length === 0) {
    throw new Error("No exercises matched your equipment and level in the database.");
  }
  const allowedIds = new Set(candidates.map((c) => c.id));

  const priorDays = await prisma.planDay.findMany({
    where: {
      planId,
      dayNumber: { lt: dayNumber },
      status: { in: ["ready", "completed"] },
      isRestDay: false,
    },
    orderBy: { dayNumber: "asc" },
  });

  const priorNames: string[] = [];
  for (const day of priorDays) {
    const w = day.workout as DayWorkout | null;
    if (!w?.exercises) continue;
    const details = await getExercisesByIds(w.exercises.map((e) => e.exerciseId));
    priorNames.push(...details.map((d) => d.name));
  }

  const { workout: raw, aiGenerated } = await generateDayWorkout({
    profile,
    focus,
    candidates,
    priorExerciseNames: priorNames,
    dayNumber,
    requireAi: true,
  });

  const sanitized = await validateAndSanitizeWorkout(raw, allowedIds);
  sanitized.coachTip = raw.coachTip ?? sanitized.coachTip;
  const enriched = await enrichWorkout(sanitized, aiGenerated);

  return prisma.planDay.update({
    where: { id: planDay.id },
    data: {
      status: params.status ?? "ready",
      workout: enriched,
      generatedAt: new Date(),
    },
  });
}

function serializePlanDay(day: {
  id: string;
  dayNumber: number;
  weekNumber: number;
  focus: string;
  isRestDay: boolean;
  status: PlanDayStatus;
  workout: unknown;
  generatedAt: Date | null;
  completedAt: Date | null;
}) {
  const unlocked = day.status === "ready" || day.status === "completed" || day.status === "generating";
  return {
    id: day.id,
    dayNumber: day.dayNumber,
    weekNumber: day.weekNumber,
    focus: day.focus,
    isRestDay: day.isRestDay,
    status: day.status,
    workout: unlocked ? day.workout : null,
    generatedAt: day.generatedAt,
    completedAt: day.completedAt,
  };
}

export async function createPlan(profile: UserProfile) {
  const skeleton = buildWeekSkeleton(profile);
  const { splitType } = skeleton;

  const plan = await prisma.plan.create({
    data: {
      profile,
      splitType,
      currentDay: 1,
      skeleton,
      days: {
        create: skeleton.days.map((d) => ({
          dayNumber: d.dayNumber,
          weekNumber: d.weekNumber,
          focus: d.focus,
          isRestDay: d.isRestDay,
          status: d.dayNumber === 1 ? "generating" : "locked",
        })),
      },
    },
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });

  const day1 = await generateAndSaveDay({
    planId: plan.id,
    dayNumber: 1,
    profile,
    status: "ready",
  });

  const refreshed = await prisma.plan.findUniqueOrThrow({
    where: { id: plan.id },
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });

  return {
    planId: refreshed.id,
    currentDay: refreshed.currentDay,
    splitType: refreshed.splitType,
    startDate: refreshed.startDate,
    skeleton: refreshed.skeleton,
    profile: refreshed.profile,
    days: refreshed.days.map(serializePlanDay),
    day1: serializePlanDay(day1),
  };
}

export async function getPlanById(planId: string) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });
  if (!plan) return null;

  return {
    planId: plan.id,
    currentDay: plan.currentDay,
    splitType: plan.splitType,
    startDate: plan.startDate,
    skeleton: plan.skeleton,
    profile: plan.profile,
    createdAt: plan.createdAt,
    days: plan.days.map(serializePlanDay),
  };
}

export async function getPlanDay(planId: string, dayNumber: number) {
  const day = await prisma.planDay.findUnique({
    where: { planId_dayNumber: { planId, dayNumber } },
  });
  if (!day) return null;
  if (day.status === "locked") {
    return {
      ...serializePlanDay(day),
      workout: null,
      locked: true,
    };
  }
  return { ...serializePlanDay(day), locked: false };
}

export async function completePlanDay(planId: string, dayNumber: number) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });
  if (!plan) throw new Error("Plan not found");

  const profile = plan.profile as UserProfile;
  const day = plan.days.find((d) => d.dayNumber === dayNumber);
  if (!day) throw new Error("Day not found");

  if (day.status === "locked") {
    throw new Error("Day is locked. Complete previous days first.");
  }
  if (day.status === "generating") {
    throw new Error("Day is still generating.");
  }
  if (dayNumber > plan.currentDay) {
    throw new Error("Cannot skip ahead.");
  }

  // Idempotent: already completed
  if (day.status !== "completed") {
    await prisma.planDay.update({
      where: { id: day.id },
      data: { status: "completed", completedAt: new Date() },
    });
  }

  const nextDayNumber = dayNumber + 1;
  if (nextDayNumber > TOTAL_DAYS) {
    const updated = await getPlanById(planId);
    return { ...updated, unlockedDay: null, message: "Plan complete!" };
  }

  const nextDay = plan.days.find((d) => d.dayNumber === nextDayNumber);
  if (!nextDay) throw new Error("Next day not found");

  // Generate next day if not already ready/completed
  if (nextDay.status === "locked" || nextDay.status === "generating" || !nextDay.workout) {
    await generateAndSaveDay({
      planId,
      dayNumber: nextDayNumber,
      profile,
      status: "ready",
    });
  }

  await prisma.plan.update({
    where: { id: planId },
    data: { currentDay: Math.max(plan.currentDay, nextDayNumber) },
  });

  const updated = await getPlanById(planId);
  const unlocked = updated?.days.find((d) => d.dayNumber === nextDayNumber) ?? null;

  return {
    ...updated,
    unlockedDay: unlocked,
    message: `Day ${dayNumber} completed. Day ${nextDayNumber} unlocked.`,
  };
}
