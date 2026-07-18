import {
  bilateralElbowAngle,
  midPoint,
} from "../lib/pose/joints";
import { PoseLandmark, getLandmark, type Landmark } from "../lib/pose/landmarks";
import {
  mergeIssueLandmarks,
} from "../lib/pose/formHighlights";
import { AngleRepFsm } from "../lib/pose/repFsm";
import { EmaSmoother } from "../lib/pose/smoothing";
import { wrongExerciseGate, resetWrongExerciseGate } from "./exerciseGate";
import { resetPoseClassifierState } from "./movementFamily";
import type { MovementFamily } from "./movementFamily";
import { classifyPose } from "./movementFamily";
import type { ExerciseTracker, TrackerResult } from "./types";

/**
 * Press (close-grip / bench / dumbbell).
 * Wrong movement family → red alert, FSM reset, zero reps.
 */
export function createPressTracker(
  exerciseName = "Press",
  expected: MovementFamily = "press",
): ExerciseTracker {
  const smoother = new EmaSmoother(0.28);
  const fsm = new AngleRepFsm({
    downEnter: 108,
    upEnter: 148,
    depthGood: 95,
    minDownMs: 150,
    cooldownMs: 360,
  });

  return {
    id: "press",
    label: exerciseName,
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
        exerciseName,
        fsm.phase,
        dtMs,
      );
      if (blocked) {
        fsm.reset();
        return blocked;
      }

      const classified = classifyPose(landmarks);
      const elbowRaw = bilateralElbowAngle(landmarks);
      const lShoulder = getLandmark(landmarks, PoseLandmark.LEFT_SHOULDER);
      const rShoulder = getLandmark(landmarks, PoseLandmark.RIGHT_SHOULDER);
      const lWrist = getLandmark(landmarks, PoseLandmark.LEFT_WRIST);
      const rWrist = getLandmark(landmarks, PoseLandmark.RIGHT_WRIST);

      if (elbowRaw == null || !lShoulder || !rShoulder) {
        return {
          phase: fsm.phase,
          repCompleted: false,
          cues: ["Keep both elbows and wrists visible for your press"],
          formOk: false,
          metrics: {},
          ready: false,
        };
      }

      const elbow = smoother.next("elbow", elbowRaw);
      const midShoulder = midPoint(lShoulder, rShoulder);
      const midWrist =
        lWrist && rWrist
          ? midPoint(lWrist, rWrist)
          : (lWrist ?? rWrist ?? null);

      let formOk = true;
      const cues: string[] = [];
      const issueLandmarks: number[] = [];

      if (
        midWrist &&
        classified?.isUpright &&
        !classified.isLyingPress &&
        fsm.phase === "up"
      ) {
        if (midWrist.y > midShoulder.y + 0.05) {
          cues.push("Press the weights upward to lockout");
          formOk = false;
          issueLandmarks.push(
            PoseLandmark.LEFT_WRIST,
            PoseLandmark.RIGHT_WRIST,
            PoseLandmark.LEFT_SHOULDER,
            PoseLandmark.RIGHT_SHOULDER,
          );
        }
      }

      const { repCompleted, shallow } = fsm.update(elbow, dtMs);
      if (shallow) {
        cues.push("Lower further — more elbow bend at the bottom");
        formOk = false;
        issueLandmarks.push(
          PoseLandmark.LEFT_ELBOW,
          PoseLandmark.RIGHT_ELBOW,
        );
      }

      if (fsm.phase === "idle") {
        cues.push(
          classified?.isLyingPress
            ? "Back on the bench — lower, then press the dumbbells up"
            : "Lower with control, then press to lockout",
        );
      } else if (fsm.inDown && !fsm.hasDepth) {
        cues.push("Keep lowering to the bottom");
      } else if (fsm.inDown) {
        cues.push("Press up to lockout");
      }

      // Never credit a rep when form failed this frame
      const counted = repCompleted && formOk;

      return {
        phase: fsm.phase,
        repCompleted: counted,
        cues: cues.slice(0, 2),
        formOk,
        issueLandmarks: mergeIssueLandmarks(issueLandmarks),
        metrics: {
          elbow: Math.round(elbow),
          lying: classified?.isLyingPress ? 1 : 0,
        },
        ready: true,
      };
    },
  };
}
