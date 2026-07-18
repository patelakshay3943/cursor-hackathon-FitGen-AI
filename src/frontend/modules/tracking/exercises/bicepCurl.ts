import {
  armChain,
  elbowAngle,
  pickArmSide,
  type Side,
} from "../lib/pose/joints";
import type { Landmark } from "../lib/pose/landmarks";
import { AngleRepFsm } from "../lib/pose/repFsm";
import { EmaSmoother } from "../lib/pose/smoothing";
import { wrongExerciseGate, resetWrongExerciseGate } from "./exerciseGate";
import { resetPoseClassifierState } from "./movementFamily";
import type { ExerciseTracker, TrackerResult } from "./types";

export function createBicepCurlTracker(): ExerciseTracker {
  const smoother = new EmaSmoother(0.28);
  const fsm = new AngleRepFsm({
    downEnter: 72,
    upEnter: 148,
    depthGood: 58,
    minDownMs: 120,
    cooldownMs: 300,
    smallerIsDown: true,
  });
  let lockedSide: Side | null = null;

  return {
    id: "bicep_curl",
    label: "Bicep Curl",
    reset() {
      smoother.reset();
      fsm.reset();
      lockedSide = null;
      resetWrongExerciseGate();
      resetPoseClassifierState();
    },
    update(landmarks: Landmark[], dtMs: number): TrackerResult {
      const blocked = wrongExerciseGate(
        landmarks,
        "curl",
        "Bicep Curl",
        fsm.phase,
        dtMs,
      );
      if (blocked) {
        fsm.reset();
        return blocked;
      }

      const cues: string[] = [];
      let formOk = true;

      if (!lockedSide) {
        lockedSide = pickArmSide(landmarks);
      }
      if (!lockedSide) {
        return {
          phase: fsm.phase,
          repCompleted: false,
          cues: ["Face the camera — show one arm clearly"],
          formOk: false,
          metrics: {},
          ready: false,
        };
      }

      const chain = armChain(landmarks, lockedSide);
      if (!chain) {
        lockedSide = pickArmSide(landmarks);
        return {
          phase: fsm.phase,
          repCompleted: false,
          cues: ["Keep your curling arm fully visible"],
          formOk: false,
          metrics: {},
          ready: false,
        };
      }

      const elbow = smoother.next("elbow", elbowAngle(chain));
      const elbowDrift = Math.abs(chain.elbow.x - chain.shoulder.x);
      const swinging = chain.hip
        ? chain.elbow.y < chain.hip.y - 0.12
        : false;

      const { repCompleted, shallow } = fsm.update(elbow, dtMs);
      if (shallow) {
        cues.push("Curl higher — hand toward shoulder");
        formOk = false;
      }
      if (elbowDrift > 0.1) {
        cues.push("Pin elbows to your sides");
        formOk = false;
      }
      if (swinging) {
        cues.push("Don't swing — keep upper arms still");
        formOk = false;
      }

      if (fsm.phase === "idle") {
        cues.push("Arms at sides — curl up, then lower slowly");
      } else if (fsm.inDown && !fsm.hasDepth) {
        cues.push("Keep curling up");
      } else if (fsm.inDown) {
        cues.push("Lower with control");
      }

      return {
        phase:
          fsm.phase === "down" ? "up" : fsm.phase === "up" ? "down" : "idle",
        repCompleted: repCompleted && formOk,
        cues: cues.slice(0, 2),
        formOk,
        metrics: {
          elbowAngle: Math.round(elbow),
          elbowDrift: Math.round(elbowDrift * 100),
          side: lockedSide === "left" ? 0 : 1,
        },
        ready: true,
      };
    },
  };
}
