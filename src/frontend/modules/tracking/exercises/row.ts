import {
  armChain,
  bilateralElbowAngle,
  midPoint,
  pickArmSide,
} from "../lib/pose/joints";
import { PoseLandmark, getLandmark, type Landmark } from "../lib/pose/landmarks";
import { AngleRepFsm } from "../lib/pose/repFsm";
import { EmaSmoother } from "../lib/pose/smoothing";
import { wrongExerciseGate, resetWrongExerciseGate } from "./exerciseGate";
import { resetPoseClassifierState } from "./movementFamily";
import type { ExerciseTracker, TrackerResult } from "./types";

/**
 * Rows / pull-ups: elbow flex cycle (pull → extend).
 * Pull-up hang prefers arms overhead; bent-over row accepts upright torso lean.
 */
export function createRowTracker(label = "Row / Pull-up"): ExerciseTracker {
  const smoother = new EmaSmoother(0.28);
  const fsm = new AngleRepFsm({
    downEnter: 100,
    upEnter: 145,
    depthGood: 85,
    minDownMs: 140,
    cooldownMs: 340,
    smallerIsDown: true,
  });

  return {
    id: "row",
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
        "row",
        label,
        fsm.phase,
        dtMs,
      );
      if (blocked) {
        fsm.reset();
        return blocked;
      }

      const cues: string[] = [];
      let formOk = true;

      const elbowRaw = bilateralElbowAngle(landmarks);
      const side = pickArmSide(landmarks);
      const chain = side ? armChain(landmarks, side) : null;
      const lShoulder = getLandmark(landmarks, PoseLandmark.LEFT_SHOULDER);
      const rShoulder = getLandmark(landmarks, PoseLandmark.RIGHT_SHOULDER);
      const lWrist = getLandmark(landmarks, PoseLandmark.LEFT_WRIST);
      const rWrist = getLandmark(landmarks, PoseLandmark.RIGHT_WRIST);

      if (elbowRaw == null || !lShoulder || !rShoulder) {
        return {
          phase: fsm.phase,
          repCompleted: false,
          cues: ["Show both arms clearly for your pull"],
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
      const armsHigh =
        midWrist != null && midWrist.y < midShoulder.y - 0.05;

      const { repCompleted, shallow } = fsm.update(elbow, dtMs);
      if (shallow) {
        cues.push("Pull further — elbows back / chin toward the bar");
        formOk = false;
      }

      if (fsm.phase === "idle") {
        cues.push(
          armsHigh
            ? "Hang ready — pull chest up, then lower with control"
            : "Hinge slightly — pull elbows back, then extend",
        );
      } else if (fsm.inDown && !fsm.hasDepth) {
        cues.push("Keep pulling — squeeze your back");
      } else if (fsm.inDown) {
        cues.push("Lower with control — 2 seconds down");
      }

      if (chain && Math.abs(chain.elbow.x - chain.shoulder.x) > 0.22 && !armsHigh) {
        cues.push("Keep elbows closer to your sides");
        formOk = false;
      }

      return {
        phase: fsm.phase,
        repCompleted: repCompleted && formOk,
        cues: cues.slice(0, 2),
        formOk,
        metrics: {
          elbow: Math.round(elbow),
          overhead: armsHigh ? 1 : 0,
          downMs: fsm.inDown ? 1 : 0,
        },
        ready: true,
      };
    },
  };
}
