import { angle3Point } from "./angles";
import {
  landmarkScore,
  type Landmark,
  PoseLandmark,
  getLandmark,
} from "./landmarks";

export type Side = "left" | "right";

export function midPoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}

/** Visibility-weighted average of two angles (better side dominates). */
export function weightedAngle(
  left: number | null,
  right: number | null,
  leftVis: number,
  rightVis: number,
): number | null {
  if (left == null && right == null) return null;
  if (left == null) return right;
  if (right == null) return left;
  const lw = Math.max(0.05, leftVis);
  const rw = Math.max(0.05, rightVis);
  return (left * lw + right * rw) / (lw + rw);
}

export function sideVisibility(
  landmarks: Landmark[],
  side: Side,
): number {
  const indices =
    side === "left"
      ? [
          PoseLandmark.LEFT_SHOULDER,
          PoseLandmark.LEFT_ELBOW,
          PoseLandmark.LEFT_WRIST,
          PoseLandmark.LEFT_HIP,
        ]
      : [
          PoseLandmark.RIGHT_SHOULDER,
          PoseLandmark.RIGHT_ELBOW,
          PoseLandmark.RIGHT_WRIST,
          PoseLandmark.RIGHT_HIP,
        ];
  let sum = 0;
  let n = 0;
  for (const i of indices) {
    const lm = landmarks[i];
    if (!lm) continue;
    sum += landmarkScore(lm);
    n += 1;
  }
  return n ? sum / n : 0;
}

/** Pick the more visible arm chain for elbow-based exercises. */
export function pickArmSide(landmarks: Landmark[]): Side | null {
  const l = sideVisibility(landmarks, "left");
  const r = sideVisibility(landmarks, "right");
  if (l < 0.4 && r < 0.4) return null;
  return l >= r ? "left" : "right";
}

export function armChain(
  landmarks: Landmark[],
  side: Side,
): { shoulder: Landmark; elbow: Landmark; wrist: Landmark; hip: Landmark | null } | null {
  const shoulder = getLandmark(
    landmarks,
    side === "left" ? PoseLandmark.LEFT_SHOULDER : PoseLandmark.RIGHT_SHOULDER,
  );
  const elbow = getLandmark(
    landmarks,
    side === "left" ? PoseLandmark.LEFT_ELBOW : PoseLandmark.RIGHT_ELBOW,
  );
  const wrist = getLandmark(
    landmarks,
    side === "left" ? PoseLandmark.LEFT_WRIST : PoseLandmark.RIGHT_WRIST,
  );
  const hip = getLandmark(
    landmarks,
    side === "left" ? PoseLandmark.LEFT_HIP : PoseLandmark.RIGHT_HIP,
  );
  if (!shoulder || !elbow || !wrist) return null;
  return { shoulder, elbow, wrist, hip };
}

export function elbowAngle(chain: {
  shoulder: Landmark;
  elbow: Landmark;
  wrist: Landmark;
}): number {
  return angle3Point(chain.shoulder, chain.elbow, chain.wrist);
}

/**
 * Both-arm elbow average for presses (close-grip / bilateral).
 * Falls back to the clearer side.
 */
export function bilateralElbowAngle(landmarks: Landmark[]): number | null {
  const left = armChain(landmarks, "left");
  const right = armChain(landmarks, "right");
  const lVis = sideVisibility(landmarks, "left");
  const rVis = sideVisibility(landmarks, "right");
  return weightedAngle(
    left ? elbowAngle(left) : null,
    right ? elbowAngle(right) : null,
    lVis,
    rVis,
  );
}

export function bilateralKneeAngle(landmarks: Landmark[]): number | null {
  const lHip = getLandmark(landmarks, PoseLandmark.LEFT_HIP);
  const rHip = getLandmark(landmarks, PoseLandmark.RIGHT_HIP);
  const lKnee = getLandmark(landmarks, PoseLandmark.LEFT_KNEE);
  const rKnee = getLandmark(landmarks, PoseLandmark.RIGHT_KNEE);
  const lAnkle = getLandmark(landmarks, PoseLandmark.LEFT_ANKLE);
  const rAnkle = getLandmark(landmarks, PoseLandmark.RIGHT_ANKLE);

  const left =
    lHip && lKnee && lAnkle ? angle3Point(lHip, lKnee, lAnkle) : null;
  const right =
    rHip && rKnee && rAnkle ? angle3Point(rHip, rKnee, rAnkle) : null;

  const lVis = Math.min(
    landmarkScore(lHip ?? undefined),
    landmarkScore(lKnee ?? undefined),
    landmarkScore(lAnkle ?? undefined),
  );
  const rVis = Math.min(
    landmarkScore(rHip ?? undefined),
    landmarkScore(rKnee ?? undefined),
    landmarkScore(rAnkle ?? undefined),
  );
  return weightedAngle(left, right, lVis, rVis);
}
