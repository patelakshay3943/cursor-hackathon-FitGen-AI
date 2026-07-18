import type { SessionStats } from "../hooks/useExerciseSession";

export function getTotalReps(stats: SessionStats): number {
  return stats.totalReps || stats.setsCompleted * stats.targetReps + stats.reps;
}

export function isEarlyQuitSession(stats: SessionStats): boolean {
  return (
    getTotalReps(stats) === 0 && stats.setsCompleted === 0 && stats.reps === 0
  );
}
