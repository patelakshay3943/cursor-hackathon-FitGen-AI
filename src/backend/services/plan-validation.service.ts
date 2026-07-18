import type { DayWorkout, WorkoutExercise } from "@/backend/types/plan.types";
import { getExercisesByIds } from "./exercise.service";

const COMPOUND_LIMIT = 3;

export async function validateAndSanitizeWorkout(
  workout: DayWorkout,
  allowedIds: Set<string>,
): Promise<DayWorkout> {
  const valid: WorkoutExercise[] = [];
  const seen = new Set<string>();

  for (const item of workout.exercises) {
    if (!allowedIds.has(item.exerciseId)) continue;
    if (seen.has(item.exerciseId)) continue;
    seen.add(item.exerciseId);
    valid.push({
      exerciseId: item.exerciseId,
      sets: Math.min(8, Math.max(1, item.sets || 3)),
      reps: item.reps || "8-12",
      restSec: Math.min(300, Math.max(30, item.restSec || 90)),
      notes: item.notes,
    });
  }

  if (valid.length === 0) {
    const fallbackIds = [...allowedIds].slice(0, 4);
    const exercises = await getExercisesByIds(fallbackIds);
    return {
      exercises: exercises.map((ex) => ({
        exerciseId: ex.id,
        sets: 3,
        reps: "8-12",
        restSec: 90,
      })),
      coachTip: workout.coachTip,
    };
  }

  const details = await getExercisesByIds(valid.map((v) => v.exerciseId));
  const mechanicById = new Map(details.map((d) => [d.id, d.mechanic]));
  let compounds = 0;
  const trimmed: WorkoutExercise[] = [];
  for (const item of valid) {
    const mechanic = mechanicById.get(item.exerciseId);
    if (mechanic === "compound") {
      compounds += 1;
      if (compounds > COMPOUND_LIMIT) continue;
    }
    trimmed.push(item);
  }

  return {
    exercises: trimmed.slice(0, 6),
    coachTip: workout.coachTip,
  };
}
