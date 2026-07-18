import type { Landmark } from "../lib/pose/landmarks";
import { FULL_BODY_SKELETON } from "../lib/pose/formHighlights";
import type { TrackerPhase, TrackerResult } from "./types";
import {
  classifyPose,
  isPoseCompatible,
  mismatchCue,
  type MovementFamily,
} from "./movementFamily";

/** After a wrong-move, stay locked until this many ms of compatible frames. */
const LOCK_CLEAR_MS = 2800;

type LockState = {
  remainingMs: number;
  cue: string;
  detected: number;
  plank: number;
  issueLandmarks: number[];
};

let lock: LockState | null = null;

export function resetWrongExerciseGate() {
  lock = null;
}

function detectedCode(family: string): number {
  if (family === "pushup") return 1;
  if (family === "squat") return 2;
  if (family === "curl") return 3;
  if (family === "press") return 4;
  if (family === "row") return 5;
  return 0;
}

function blockedResult(
  cue: string,
  detected: number,
  plank: number,
  phase: TrackerPhase,
  issueLandmarks: number[],
): TrackerResult {
  return {
    phase,
    repCompleted: false,
    cues: [cue],
    formOk: false,
    issueLandmarks,
    metrics: {
      mismatch: 1,
      plank,
      detected,
    },
    ready: true,
  };
}

/**
 * If the live pose does not match the selected exercise, block counting.
 * Sticky: once wrong, stays blocked until ~2s of continuous compatible pose
 * so intermittent flicker cannot sneak reps through.
 */
export function wrongExerciseGate(
  landmarks: Landmark[],
  expected: MovementFamily,
  exerciseName: string,
  phase: TrackerPhase = "idle",
  dtMs = 33,
): TrackerResult | null {
  const classified = classifyPose(landmarks);

  if (classified && !isPoseCompatible(expected, classified)) {
    const cue = mismatchCue(expected, classified.family, exerciseName);
    const issueLandmarks = FULL_BODY_SKELETON;
    lock = {
      remainingMs: LOCK_CLEAR_MS,
      cue,
      detected: detectedCode(classified.family),
      plank: classified.isPlank ? 1 : 0,
      issueLandmarks,
    };
    return blockedResult(cue, lock.detected, lock.plank, "idle", issueLandmarks);
  }

  // Still in sticky lock — do not count even if this frame looks ok
  if (lock) {
    if (classified && isPoseCompatible(expected, classified)) {
      lock.remainingMs -= dtMs;
      if (lock.remainingMs <= 0) {
        lock = null;
        return null;
      }
    } else {
      // Lost pose or still ambiguous — keep full lock
      lock.remainingMs = LOCK_CLEAR_MS;
    }

    return blockedResult(
      lock.cue,
      lock.detected,
      lock.plank,
      phase === "idle" ? "idle" : phase,
      lock.issueLandmarks.length ? lock.issueLandmarks : FULL_BODY_SKELETON,
    );
  }

  return null;
}

export function blockedRep(result: TrackerResult): TrackerResult {
  return { ...result, repCompleted: false };
}
