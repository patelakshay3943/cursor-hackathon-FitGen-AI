import type { MovementFamily } from "../../exercises/movementFamily";
import { POSE_CONNECTIONS, PoseLandmark } from "./landmarks";

/** Merge landmark index sets without duplicates. */
export function mergeIssueLandmarks(...sets: (number[] | undefined)[]): number[] {
  const out = new Set<number>();
  for (const set of sets) {
    if (!set) continue;
    for (const i of set) out.add(i);
  }
  return [...out];
}

export const UPPER_BODY_LANDMARKS = [
  PoseLandmark.LEFT_SHOULDER,
  PoseLandmark.RIGHT_SHOULDER,
  PoseLandmark.LEFT_ELBOW,
  PoseLandmark.RIGHT_ELBOW,
  PoseLandmark.LEFT_WRIST,
  PoseLandmark.RIGHT_WRIST,
];

export const LOWER_BODY_LANDMARKS = [
  PoseLandmark.LEFT_HIP,
  PoseLandmark.RIGHT_HIP,
  PoseLandmark.LEFT_KNEE,
  PoseLandmark.RIGHT_KNEE,
  PoseLandmark.LEFT_ANKLE,
  PoseLandmark.RIGHT_ANKLE,
];

/** All skeleton joints used for drawing — full-body wrong-exercise highlight */
export const FULL_BODY_SKELETON = mergeIssueLandmarks(
  UPPER_BODY_LANDMARKS,
  LOWER_BODY_LANDMARKS,
  [...new Set(POSE_CONNECTIONS.flat())],
);

export function isWholeExerciseWrong(metrics: Record<string, number>): boolean {
  return metrics.mismatch === 1 || metrics.plank === 1;
}

const PART_GROUPS: { label: string; indices: number[] }[] = [
  { label: "Shoulders", indices: [PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER] },
  { label: "Elbows", indices: [PoseLandmark.LEFT_ELBOW, PoseLandmark.RIGHT_ELBOW] },
  { label: "Wrists", indices: [PoseLandmark.LEFT_WRIST, PoseLandmark.RIGHT_WRIST] },
  { label: "Hips", indices: [PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP] },
  { label: "Knees", indices: [PoseLandmark.LEFT_KNEE, PoseLandmark.RIGHT_KNEE] },
  { label: "Ankles", indices: [PoseLandmark.LEFT_ANKLE, PoseLandmark.RIGHT_ANKLE] },
];

/** Human-readable body regions for coach alerts */
export function bodyPartLabels(indices: number[]): string[] {
  const set = new Set(indices);
  const labels: string[] = [];
  for (const { label, indices: group } of PART_GROUPS) {
    if (group.some((i) => set.has(i))) labels.push(label);
  }
  return labels;
}

/** Instant on-device suggestion — LLM refines within ~5s */
export function buildLocalSuggestion(
  cue: string,
  bodyParts: string[],
  wholeExerciseWrong: boolean,
  exerciseName: string,
): string {
  if (wholeExerciseWrong) {
    return `Wrong movement for ${exerciseName}. Reset your full body to the correct starting position.`;
  }
  if (bodyParts.length) {
    return `Adjust ${bodyParts.join(" & ")} — ${cue}`;
  }
  return cue;
}

export function sideArmLandmarks(side: "left" | "right"): number[] {
  return side === "left"
    ? [
        PoseLandmark.LEFT_SHOULDER,
        PoseLandmark.LEFT_ELBOW,
        PoseLandmark.LEFT_WRIST,
      ]
    : [
        PoseLandmark.RIGHT_SHOULDER,
        PoseLandmark.RIGHT_ELBOW,
        PoseLandmark.RIGHT_WRIST,
      ];
}

export function sideCoreLandmarks(side: "left" | "right"): number[] {
  return side === "left"
    ? [
        PoseLandmark.LEFT_SHOULDER,
        PoseLandmark.LEFT_HIP,
        PoseLandmark.LEFT_ANKLE,
      ]
    : [
        PoseLandmark.RIGHT_SHOULDER,
        PoseLandmark.RIGHT_HIP,
        PoseLandmark.RIGHT_ANKLE,
      ];
}

/** Highlight the body region that looks like the wrong exercise. */
export function landmarksForDetectedFamily(family: MovementFamily): number[] {
  switch (family) {
    case "pushup":
      return FULL_BODY_SKELETON;
    case "squat":
    case "lunge":
      return LOWER_BODY_LANDMARKS;
    case "curl":
    case "press":
    case "row":
      return UPPER_BODY_LANDMARKS;
    case "hinge":
      return [
        PoseLandmark.LEFT_SHOULDER,
        PoseLandmark.RIGHT_SHOULDER,
        PoseLandmark.LEFT_HIP,
        PoseLandmark.RIGHT_HIP,
        PoseLandmark.LEFT_KNEE,
        PoseLandmark.RIGHT_KNEE,
      ];
    default:
      return UPPER_BODY_LANDMARKS;
  }
}
