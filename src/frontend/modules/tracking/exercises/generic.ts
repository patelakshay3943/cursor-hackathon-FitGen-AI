import { PoseLandmark, getLandmark, type Landmark } from "../lib/pose/landmarks";
import { AngleRepFsm } from "../lib/pose/repFsm";
import { EmaSmoother } from "../lib/pose/smoothing";
import { wrongExerciseGate, resetWrongExerciseGate } from "./exerciseGate";
import {
  resetPoseClassifierState,
  type MovementFamily,
} from "./movementFamily";
import type { ExerciseTracker, TrackerResult } from "./types";

export function createGenericTracker(
  label = "General",
  expected: MovementFamily = "generic",
): ExerciseTracker {
  const smoother = new EmaSmoother(0.28);
  const fsm = new AngleRepFsm({
    downEnter: 0.55,
    upEnter: 0.32,
    depthGood: 0.62,
    minDownMs: 160,
    cooldownMs: 400,
    smallerIsDown: false,
  });

  return {
    id: "generic",
    label,
    reset() {
      smoother.reset();
      fsm.reset();
      resetWrongExerciseGate();
      resetPoseClassifierState();
    },
    update(landmarks: Landmark[], dtMs: number): TrackerResult {
      const blocked = wrongExerciseGate(
        landmarks,
        expected,
        label,
        fsm.phase,
        dtMs,
      );
      if (blocked) {
        fsm.reset();
        return blocked;
      }

      const lShoulder = getLandmark(landmarks, PoseLandmark.LEFT_SHOULDER);
      const rShoulder = getLandmark(landmarks, PoseLandmark.RIGHT_SHOULDER);
      const lHip = getLandmark(landmarks, PoseLandmark.LEFT_HIP);
      const rHip = getLandmark(landmarks, PoseLandmark.RIGHT_HIP);
      const lWrist = getLandmark(landmarks, PoseLandmark.LEFT_WRIST);
      const rWrist = getLandmark(landmarks, PoseLandmark.RIGHT_WRIST);

      if (!lShoulder || !rShoulder || !lHip || !rHip) {
        return {
          phase: fsm.phase,
          repCompleted: false,
          cues: ["Step back — keep your full body in frame"],
          formOk: false,
          metrics: {},
          ready: false,
        };
      }

      const midHipY = (lHip.y + rHip.y) / 2;
      const midShoulderY = (lShoulder.y + rShoulder.y) / 2;
      const torsoLen = Math.max(0.08, Math.abs(midHipY - midShoulderY));
      const hipDrop = Math.max(0, midHipY - midShoulderY) / torsoLen;

      let armFlex = 0;
      if (lWrist && rWrist) {
        const left = Math.hypot(lWrist.x - lShoulder.x, lWrist.y - lShoulder.y);
        const right = Math.hypot(rWrist.x - rShoulder.x, rWrist.y - rShoulder.y);
        armFlex = (left + right) / 2 / Math.max(0.1, torsoLen);
      }

      const useArm =
        expected === "press" ||
        expected === "curl" ||
        expected === "row" ||
        (armFlex > 0.9 && hipDrop < 1.6);

      const signal = smoother.next("motion", useArm ? armFlex : hipDrop);
      const { repCompleted, shallow } = fsm.update(signal, dtMs);

      let formOk = !shallow;
      const cues: string[] = [];
      if (shallow) {
        cues.push("Use a fuller range of motion");
      } else if (fsm.phase === "idle") {
        cues.push(
          useArm
            ? `Perform your ${label} with a clear arm path`
            : `Perform a clear ${label} — full body visible`,
        );
      } else if (fsm.inDown) {
        cues.push("Good depth — return to start to count");
      } else {
        cues.push("Steady pace — match the exercise form");
      }

      return {
        phase: fsm.phase,
        repCompleted: repCompleted && formOk,
        cues: cues.slice(0, 2),
        formOk,
        metrics: {
          signal: Math.round(signal * 1000) / 1000,
          mode: useArm ? 1 : 0,
        },
        ready: true,
      };
    },
  };
}
