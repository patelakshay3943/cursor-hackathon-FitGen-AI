import { angle3Point } from "../lib/pose/angles";
import { midPoint } from "../lib/pose/joints";
import { PoseLandmark, getLandmark, type Landmark } from "../lib/pose/landmarks";
import { AngleRepFsm } from "../lib/pose/repFsm";
import { EmaSmoother } from "../lib/pose/smoothing";
import { wrongExerciseGate, resetWrongExerciseGate } from "./exerciseGate";
import { resetPoseClassifierState } from "./movementFamily";
import type { ExerciseTracker, TrackerResult } from "./types";

/** Lunges: front-knee bend cycle with split stance. */
export function createLungeTracker(): ExerciseTracker {
  const smoother = new EmaSmoother(0.28);
  const fsm = new AngleRepFsm({
    downEnter: 118,
    upEnter: 155,
    depthGood: 105,
    minDownMs: 160,
    cooldownMs: 380,
  });

  return {
    id: "lunge",
    label: "Lunge",
    reset() {
      smoother.reset();
      fsm.reset();
      resetWrongExerciseGate();
      resetPoseClassifierState();
    },
    update(landmarks: Landmark[], dtMs: number): TrackerResult {
      const blocked = wrongExerciseGate(
        landmarks,
        "lunge",
        "Lunge",
        fsm.phase,
        dtMs,
      );
      if (blocked) {
        fsm.reset();
        return blocked;
      }

      const cues: string[] = [];
      let formOk = true;

      const lHip = getLandmark(landmarks, PoseLandmark.LEFT_HIP);
      const rHip = getLandmark(landmarks, PoseLandmark.RIGHT_HIP);
      const lKnee = getLandmark(landmarks, PoseLandmark.LEFT_KNEE);
      const rKnee = getLandmark(landmarks, PoseLandmark.RIGHT_KNEE);
      const lAnkle = getLandmark(landmarks, PoseLandmark.LEFT_ANKLE);
      const rAnkle = getLandmark(landmarks, PoseLandmark.RIGHT_ANKLE);
      const lShoulder = getLandmark(landmarks, PoseLandmark.LEFT_SHOULDER);
      const rShoulder = getLandmark(landmarks, PoseLandmark.RIGHT_SHOULDER);

      if (!lHip || !rHip || !lKnee || !rKnee || !lAnkle || !rAnkle) {
        return {
          phase: fsm.phase,
          repCompleted: false,
          cues: ["Step back — show hips, knees, and ankles"],
          formOk: false,
          metrics: {},
          ready: false,
        };
      }

      const kneeL = angle3Point(lHip, lKnee, lAnkle);
      const kneeR = angle3Point(rHip, rKnee, rAnkle);
      const kneeMin = Math.min(kneeL, kneeR);
      const kneeAsym = Math.abs(kneeL - kneeR);
      const frontKnee = smoother.next("knee", kneeMin);

      const midShoulder =
        lShoulder && rShoulder ? midPoint(lShoulder, rShoulder) : null;
      const midHip = midPoint(lHip, rHip);
      if (midShoulder && midHip.y - midShoulder.y < 0.08) {
        return {
          phase: "idle",
          repCompleted: false,
          cues: ["Stand tall for lunges — camera at an angle works best"],
          formOk: false,
          metrics: { mismatch: 0 },
          ready: false,
        };
      }

      if (kneeAsym < 18 && fsm.phase === "idle") {
        cues.push("Step into a split stance — one foot forward");
      }

      const { repCompleted, shallow } = fsm.update(frontKnee, dtMs);
      if (shallow) {
        cues.push("Drop the back knee lower for full depth");
        formOk = false;
      }

      if (fsm.phase === "idle" && cues.length === 0) {
        cues.push("Step forward, lower under control, then drive up");
      } else if (fsm.inDown && !fsm.hasDepth) {
        cues.push("Keep lowering — front thigh toward parallel");
      } else if (fsm.inDown) {
        cues.push("Drive through the front heel — 2s down tempo");
      }

      // Front knee shouldn't shoot far past toes (rough x check)
      const frontIsLeft = kneeL <= kneeR;
      const frontKneeLm = frontIsLeft ? lKnee : rKnee;
      const frontAnkleLm = frontIsLeft ? lAnkle : rAnkle;
      if (
        (fsm.inDown || fsm.phase === "up") &&
        Math.abs(frontKneeLm.x - frontAnkleLm.x) > 0.12
      ) {
        cues.push("Keep front knee stacked over the ankle");
        formOk = false;
      }

      return {
        phase: fsm.phase,
        repCompleted: repCompleted && formOk,
        cues: cues.slice(0, 2),
        formOk,
        metrics: {
          frontKnee: Math.round(frontKnee),
          asym: Math.round(kneeAsym),
          downMs: fsm.inDown ? 1 : 0,
        },
        ready: true,
      };
    },
  };
}
