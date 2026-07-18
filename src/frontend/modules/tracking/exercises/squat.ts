import {
  bilateralKneeAngle,
  midPoint,
} from "../lib/pose/joints";
import { PoseLandmark, getLandmark, type Landmark } from "../lib/pose/landmarks";
import { AngleRepFsm } from "../lib/pose/repFsm";
import { EmaSmoother } from "../lib/pose/smoothing";
import { wrongExerciseGate, resetWrongExerciseGate } from "./exerciseGate";
import { resetPoseClassifierState } from "./movementFamily";
import type { ExerciseTracker, TrackerResult } from "./types";

export function createSquatTracker(): ExerciseTracker {
  const smoother = new EmaSmoother(0.28);
  const fsm = new AngleRepFsm({
    downEnter: 112,
    upEnter: 152,
    depthGood: 98,
    minDownMs: 160,
    cooldownMs: 350,
  });
  let standingBaseline: number | null = null;

  return {
    id: "squat",
    label: "Squat",
    reset() {
      smoother.reset();
      fsm.reset();
      standingBaseline = null;
      resetWrongExerciseGate();
      resetPoseClassifierState();
    },
    update(landmarks: Landmark[], dtMs: number): TrackerResult {
      const blocked = wrongExerciseGate(
        landmarks,
        "squat",
        "Squat",
        fsm.phase,
        dtMs,
      );
      if (blocked) {
        fsm.reset();
        return blocked;
      }

      const cues: string[] = [];
      let formOk = true;

      const kneeRaw = bilateralKneeAngle(landmarks);
      const lHip = getLandmark(landmarks, PoseLandmark.LEFT_HIP);
      const rHip = getLandmark(landmarks, PoseLandmark.RIGHT_HIP);
      const lKnee = getLandmark(landmarks, PoseLandmark.LEFT_KNEE);
      const rKnee = getLandmark(landmarks, PoseLandmark.RIGHT_KNEE);
      const lAnkle = getLandmark(landmarks, PoseLandmark.LEFT_ANKLE);
      const rAnkle = getLandmark(landmarks, PoseLandmark.RIGHT_ANKLE);
      const lShoulder = getLandmark(landmarks, PoseLandmark.LEFT_SHOULDER);
      const rShoulder = getLandmark(landmarks, PoseLandmark.RIGHT_SHOULDER);

      if (
        kneeRaw == null ||
        !lHip ||
        !rHip ||
        !lKnee ||
        !rKnee ||
        !lAnkle ||
        !rAnkle
      ) {
        return {
          phase: fsm.phase,
          repCompleted: false,
          cues: ["Step back — show hips, knees, and ankles clearly"],
          formOk: false,
          metrics: {},
          ready: false,
        };
      }

      const kneeAngle = smoother.next("knee", kneeRaw);
      if (standingBaseline == null && kneeAngle > 155) {
        standingBaseline = kneeAngle;
      }

      const midShoulder =
        lShoulder && rShoulder ? midPoint(lShoulder, rShoulder) : null;
      const midHip = midPoint(lHip, rHip);
      let torsoLean = 0;
      if (midShoulder) {
        const dx = midShoulder.x - midHip.x;
        const dy = midShoulder.y - midHip.y;
        torsoLean = smoother.next(
          "torso",
          (Math.abs(Math.atan2(dx, Math.abs(dy) + 1e-6)) * 180) / Math.PI,
        );
      }

      const valgus = Math.max(
        Math.abs(lKnee.x - lAnkle.x),
        Math.abs(rKnee.x - rAnkle.x),
      );

      if (midShoulder && midHip.y - midShoulder.y < 0.08) {
        fsm.reset();
        return {
          phase: "idle",
          repCompleted: false,
          cues: ["Stand upright facing the camera for squats"],
          formOk: false,
          metrics: { mismatch: 1, kneeAngle: Math.round(kneeAngle) },
          ready: true,
        };
      }

      const { repCompleted, shallow } = fsm.update(kneeAngle, dtMs);
      if (shallow) {
        cues.push("Go deeper — thighs closer to parallel");
        formOk = false;
      }

      if (fsm.inDown || fsm.phase === "up") {
        if (valgus > 0.07) {
          cues.push("Keep knees tracking over toes");
          formOk = false;
        }
        if (torsoLean > 42) {
          cues.push("Chest up — reduce forward lean");
          formOk = false;
        }
      }

      if (fsm.phase === "idle") {
        cues.push("Stand tall, then squat down with control");
      } else if (fsm.inDown && !fsm.hasDepth) {
        cues.push("Keep lowering to depth");
      } else if (fsm.inDown) {
        cues.push("Drive up through your heels");
      }

      return {
        phase: fsm.phase,
        repCompleted: repCompleted && formOk,
        cues: cues.slice(0, 2),
        formOk,
        metrics: {
          kneeAngle: Math.round(kneeAngle),
          torsoLean: Math.round(torsoLean),
          valgus: Math.round(valgus * 100),
          baseline: standingBaseline ? Math.round(standingBaseline) : 0,
        },
        ready: true,
      };
    },
  };
}
