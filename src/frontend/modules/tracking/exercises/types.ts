import type { Landmark } from "../lib/pose/landmarks";

export type TrackerPhase = "idle" | "down" | "up" | "hold";

export type TrackerResult = {
  phase: TrackerPhase;
  repCompleted: boolean;
  cues: string[];
  formOk: boolean;
  metrics: Record<string, number>;
  ready: boolean;
};

export interface ExerciseTracker {
  id: string;
  label: string;
  reset(): void;
  update(landmarks: Landmark[], dtMs: number): TrackerResult;
}

export type TrackerFactory = () => ExerciseTracker;
