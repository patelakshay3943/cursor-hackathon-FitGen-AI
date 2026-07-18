import { angle3Point } from "../lib/pose/angles";
import {
  armChain,
  elbowAngle,
  pickArmSide,
  sideVisibility,
} from "../lib/pose/joints";
import { PoseLandmark, getLandmark, type Landmark } from "../lib/pose/landmarks";
import {
  mergeIssueLandmarks,
  sideArmLandmarks,
  sideCoreLandmarks,
} from "../lib/pose/formHighlights";
import { AngleRepFsm } from "../lib/pose/repFsm";
import { EmaSmoother } from "../lib/pose/smoothing";
import { wrongExerciseGate, resetWrongExerciseGate } from "./exerciseGate";
import { resetPoseClassifierState } from "./movementFamily";
import type { ExerciseTracker, TrackerResult } from "./types";

export function createPushupTracker(): ExerciseTracker {
  const smoother = new EmaSmoother(0.28);
  const fsm = new AngleRepFsm({
    downEnter: 105,
    upEnter: 150,
    depthGood: 92,
    minDownMs: 140,
    cooldownMs: 320,
  });

  return {
    id: "pushup",
    label: "Push-up",
    reset() {
      smoother.reset();
      fsm.reset();
      resetWrongExerciseGate();
      resetPoseClassifierState();
    },
    update(landmarks: Landmark[], dtMs: number): TrackerResult {
      const blocked = wrongExerciseGate(
        landmarks,
        "pushup",
        "Push-up",
        fsm.phase,
        dtMs,
      );
      if (blocked) {
        fsm.reset();
        return blocked;
      }

      const cues: string[] = [];
      let formOk = true;
      const issueLandmarks: number[] = [];

      const side = pickArmSide(landmarks);
      if (!side) {
        return {
          phase: fsm.phase,
          repCompleted: false,
          cues: ["Angle your body ¾ to the camera — show one full arm"],
          formOk: false,
          metrics: {},
          ready: false,
        };
      }

      const chain = armChain(landmarks, side);
      const hip = getLandmark(
        landmarks,
        side === "left" ? PoseLandmark.LEFT_HIP : PoseLandmark.RIGHT_HIP,
      );
      const ankle = getLandmark(
        landmarks,
        side === "left" ? PoseLandmark.LEFT_ANKLE : PoseLandmark.RIGHT_ANKLE,
      );

      if (!chain || !hip) {
        return {
          phase: fsm.phase,
          repCompleted: false,
          cues: ["Show shoulder, elbow, wrist, and hip"],
          formOk: false,
          metrics: {},
          ready: false,
        };
      }

      const elbow = smoother.next("elbow", elbowAngle(chain));
      let bodyLine = 170;
      if (ankle) {
        bodyLine = smoother.next(
          "body",
          angle3Point(chain.shoulder, hip, ankle),
        );
      }

      const wristShoulderY = Math.abs(chain.wrist.y - chain.shoulder.y);
      if (wristShoulderY > 0.28) {
        cues.push("Place hands under shoulders");
        formOk = false;
        issueLandmarks.push(...sideArmLandmarks(side));
      }

      const { repCompleted, shallow } = fsm.update(elbow, dtMs);
      if (shallow) {
        cues.push("Lower chest closer to the floor");
        formOk = false;
        issueLandmarks.push(
          side === "left" ? PoseLandmark.LEFT_ELBOW : PoseLandmark.RIGHT_ELBOW,
          side === "left" ? PoseLandmark.LEFT_WRIST : PoseLandmark.RIGHT_WRIST,
        );
      }

      if (ankle && bodyLine < 148) {
        cues.push("Straight body line — tighten your core");
        formOk = false;
        issueLandmarks.push(...sideCoreLandmarks(side));
      }

      if (fsm.phase === "idle") {
        cues.push("Plank ready — bend elbows to lower");
      } else if (fsm.inDown && !fsm.hasDepth) {
        cues.push("Keep lowering");
      } else if (fsm.inDown) {
        cues.push("Press up strong");
      }

      return {
        phase: fsm.phase,
        repCompleted: repCompleted && formOk,
        cues: cues.slice(0, 2),
        formOk,
        issueLandmarks: mergeIssueLandmarks(issueLandmarks),
        metrics: {
          elbowAngle: Math.round(elbow),
          bodyLine: Math.round(bodyLine),
          sideVis: Math.round(sideVisibility(landmarks, side) * 100),
        },
        ready: true,
      };
    },
  };
}
