import { midPoint } from "../lib/pose/joints";
import { PoseLandmark, getLandmark, type Landmark } from "../lib/pose/landmarks";
import { AngleRepFsm } from "../lib/pose/repFsm";
import { EmaSmoother } from "../lib/pose/smoothing";
import { wrongExerciseGate, resetWrongExerciseGate } from "./exerciseGate";
import { resetPoseClassifierState } from "./movementFamily";
import type { ExerciseTracker, TrackerResult } from "./types";

/** Hip hinge / RDL / deadlift: torso lean down then return upright. */
export function createHingeTracker(label = "Hip Hinge"): ExerciseTracker {
  const smoother = new EmaSmoother(0.28);
  // Larger lean angle = "down" for hinge
  const fsm = new AngleRepFsm({
    downEnter: 28,
    upEnter: 14,
    depthGood: 36,
    minDownMs: 180,
    cooldownMs: 400,
    smallerIsDown: false,
  });

  return {
    id: "hinge",
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
        "hinge",
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

      const lShoulder = getLandmark(landmarks, PoseLandmark.LEFT_SHOULDER);
      const rShoulder = getLandmark(landmarks, PoseLandmark.RIGHT_SHOULDER);
      const lHip = getLandmark(landmarks, PoseLandmark.LEFT_HIP);
      const rHip = getLandmark(landmarks, PoseLandmark.RIGHT_HIP);
      const lKnee = getLandmark(landmarks, PoseLandmark.LEFT_KNEE);
      const rKnee = getLandmark(landmarks, PoseLandmark.RIGHT_KNEE);

      if (!lShoulder || !rShoulder || !lHip || !rHip) {
        return {
          phase: fsm.phase,
          repCompleted: false,
          cues: ["Stand side-on — show shoulders and hips"],
          formOk: false,
          metrics: {},
          ready: false,
        };
      }

      const midShoulder = midPoint(lShoulder, rShoulder);
      const midHip = midPoint(lHip, rHip);
      const dx = midShoulder.x - midHip.x;
      const dy = midHip.y - midShoulder.y;
      const leanRaw =
        (Math.abs(Math.atan2(dx, Math.abs(dy) + 1e-6)) * 180) / Math.PI;
      const lean = smoother.next("lean", leanRaw);

      let kneeSoft = 170;
      if (lHip && lKnee && rHip && rKnee) {
        const midKnee = midPoint(lKnee, rKnee);
        const kh = Math.hypot(midKnee.x - midHip.x, midKnee.y - midHip.y);
        kneeSoft = smoother.next("kneeSoft", kh * 400);
      }

      const { repCompleted, shallow } = fsm.update(lean, dtMs);
      if (shallow) {
        cues.push("Hinge deeper — push hips back further");
        formOk = false;
      }

      if (fsm.inDown && lean > 55) {
        cues.push("Chest up — don't round into a squat");
        formOk = false;
      }

      if (fsm.phase === "idle") {
        cues.push("Soft knees — push hips back, then stand tall");
      } else if (fsm.inDown && !fsm.hasDepth) {
        cues.push("Keep hinging — feel the hamstrings");
      } else if (fsm.inDown) {
        cues.push("Drive hips forward to stand — slow the lower");
      }

      return {
        phase: fsm.phase,
        repCompleted: repCompleted && formOk,
        cues: cues.slice(0, 2),
        formOk,
        metrics: {
          lean: Math.round(lean),
          kneeSoft: Math.round(kneeSoft),
          downMs: fsm.inDown ? 1 : 0,
        },
        ready: true,
      };
    },
  };
}
