/** BlazePose 33 landmark indices (MediaPipe Pose Landmarker) */
export const PoseLandmark = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

/** Connections for drawing a simplified skeleton */
export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 31],
  [28, 32],
];

export function landmarkScore(lm: Landmark | undefined): number {
  if (!lm) return 0;
  const v = lm.visibility ?? 1;
  const p = lm.presence ?? 1;
  return Math.min(v, p);
}

export function averageVisibility(
  landmarks: Landmark[],
  indices: number[],
): number {
  if (!landmarks.length || !indices.length) return 0;
  let sum = 0;
  let n = 0;
  for (const i of indices) {
    const lm = landmarks[i];
    if (!lm) continue;
    sum += landmarkScore(lm);
    n += 1;
  }
  return n === 0 ? 0 : sum / n;
}

export function getLandmark(landmarks: Landmark[], index: number): Landmark | null {
  const lm = landmarks[index];
  // Stricter visibility gate → fewer noisy angles
  if (!lm || landmarkScore(lm) < 0.45) return null;
  return lm;
}
