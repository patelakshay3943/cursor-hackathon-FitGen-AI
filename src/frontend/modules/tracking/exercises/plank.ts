import { angle3Point } from "../lib/pose/angles";
import { midPoint } from "../lib/pose/joints";
import { PoseLandmark, getLandmark, type Landmark } from "../lib/pose/landmarks";
import { EmaSmoother } from "../lib/pose/smoothing";
import { wrongExerciseGate, resetWrongExerciseGate } from "./exerciseGate";
import { resetPoseClassifierState } from "./movementFamily";
import type { ExerciseTracker, TrackerResult } from "./types";

const HOLD_TICK_MS = 5000;

/** Plank hold — every 5s of solid plank counts as 1 rep. */
export function createPlankTracker(): ExerciseTracker {
  const smoother = new EmaSmoother(0.3);
  let holdMs = 0;
  let tickAcc = 0;

  return {
    id: "plank",
    label: "Plank",
    reset() {
      smoother.reset();
      holdMs = 0;
      tickAcc = 0;
      resetWrongExerciseGate();
      resetPoseClassifierState();
    },
    update(landmarks: Landmark[], dtMs: number): TrackerResult {
      // Plank shares the push-up / floor family for wrong-exercise gating
      const blocked = wrongExerciseGate(
        landmarks,
        "pushup",
        "Plank",
        "hold",
        dtMs,
      );
      if (blocked) {
        holdMs = 0;
        tickAcc = 0;
        return {
          ...blocked,
          cues: [
            "Get into a plank — hands under shoulders, legs straight (not standing)",
          ],
        };
      }

      const cues: string[] = [];
      let formOk = true;

      const lShoulder = getLandmark(landmarks, PoseLandmark.LEFT_SHOULDER);
      const rShoulder = getLandmark(landmarks, PoseLandmark.RIGHT_SHOULDER);
      const lHip = getLandmark(landmarks, PoseLandmark.LEFT_HIP);
      const rHip = getLandmark(landmarks, PoseLandmark.RIGHT_HIP);
      const lAnkle = getLandmark(landmarks, PoseLandmark.LEFT_ANKLE);
      const rAnkle = getLandmark(landmarks, PoseLandmark.RIGHT_ANKLE);
      const lWrist = getLandmark(landmarks, PoseLandmark.LEFT_WRIST);
      const rWrist = getLandmark(landmarks, PoseLandmark.RIGHT_WRIST);

      if (!lShoulder || !rShoulder || !lHip || !rHip) {
        holdMs = 0;
        tickAcc = 0;
        return {
          phase: "idle",
          repCompleted: false,
          cues: ["Setup: full body in frame — plank on hands or forearms"],
          formOk: false,
          metrics: {},
          ready: false,
        };
      }

      const midShoulder = midPoint(lShoulder, rShoulder);
      const midHip = midPoint(lHip, rHip);
      const midAnkle =
        lAnkle && rAnkle
          ? midPoint(lAnkle, rAnkle)
          : (lAnkle ?? rAnkle ?? null);

      let bodyLine = 170;
      if (midAnkle) {
        bodyLine = smoother.next(
          "body",
          angle3Point(midShoulder, midHip, midAnkle),
        );
      }

      const midWrist =
        lWrist && rWrist
          ? midPoint(lWrist, rWrist)
          : (lWrist ?? rWrist ?? null);
      const handsOk =
        midWrist != null && Math.abs(midWrist.y - midShoulder.y) < 0.28;

      if (!handsOk) {
        cues.push("Stack hands under shoulders");
        formOk = false;
      }
      if (bodyLine < 148) {
        cues.push("Straight body line — don't sag or pike");
        formOk = false;
      }

      if (!formOk) {
        tickAcc = Math.max(0, tickAcc - dtMs);
        return {
          phase: "hold",
          repCompleted: false,
          cues: cues.slice(0, 2),
          formOk: false,
          metrics: { holdSec: Math.round(holdMs / 1000), bodyLine: Math.round(bodyLine) },
          ready: true,
        };
      }

      holdMs += dtMs;
      tickAcc += dtMs;
      cues.push(`Hold strong — ${Math.round(holdMs / 1000)}s · breathe steady`);

      let repCompleted = false;
      if (tickAcc >= HOLD_TICK_MS) {
        repCompleted = true;
        tickAcc -= HOLD_TICK_MS;
      }

      return {
        phase: "hold",
        repCompleted,
        cues: cues.slice(0, 2),
        formOk: true,
        metrics: {
          holdSec: Math.round(holdMs / 1000),
          bodyLine: Math.round(bodyLine),
        },
        ready: true,
      };
    },
  };
}
