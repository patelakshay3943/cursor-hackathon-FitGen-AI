import { NextResponse } from "next/server";
import { userProfileSchema } from "@/backend/types/plan.types";
import { createPlan, getPlanById, getPlanDay, completePlanDay } from "@/backend/services/plan.service";
import { listExercises, buildImageUrls } from "@/backend/services/exercise.service";

export async function generatePlanController(body: unknown) {
  const parsed = userProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await createPlan(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("generatePlan error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate plan" },
      { status: 500 },
    );
  }
}

export async function getPlanController(id: string) {
  const plan = await getPlanById(id);
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  return NextResponse.json(plan);
}

export async function getPlanDayController(id: string, dayNumber: number) {
  if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > 28) {
    return NextResponse.json({ error: "Invalid day number" }, { status: 400 });
  }
  const day = await getPlanDay(id, dayNumber);
  if (!day) {
    return NextResponse.json({ error: "Day not found" }, { status: 404 });
  }
  return NextResponse.json(day);
}

export async function completePlanDayController(id: string, dayNumber: number) {
  if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > 28) {
    return NextResponse.json({ error: "Invalid day number" }, { status: 400 });
  }
  try {
    const result = await completePlanDay(id, dayNumber);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to complete day";
    const status = message.includes("not found")
      ? 404
      : message.includes("locked") || message.includes("skip") || message.includes("generating")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function listExercisesController(searchParams: URLSearchParams) {
  try {
    const rows = await listExercises({
      level: searchParams.get("level") ?? undefined,
      equipment: searchParams.get("equipment") ?? undefined,
      muscle: searchParams.get("muscle") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 40,
    });

    return NextResponse.json({
      exercises: rows.map((ex) => ({
        id: ex.id,
        name: ex.name,
        level: ex.level,
        equipment: ex.equipment,
        category: ex.category,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        instructions: ex.instructions,
        imageUrls: buildImageUrls(ex.images),
      })),
    });
  } catch (err) {
    console.error("listExercises error:", err);
    return NextResponse.json({ error: "Failed to list exercises" }, { status: 500 });
  }
}
