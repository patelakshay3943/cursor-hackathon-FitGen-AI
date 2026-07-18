import type { Landmark } from "../lib/pose/landmarks";
import { PoseLandmark, getLandmark, landmarkScore } from "../lib/pose/landmarks";
import { angle3Point } from "../lib/pose/angles";
import { midPoint } from "../lib/pose/joints";

/** High-level movement the selected exercise expects */
export type MovementFamily =
  | "pushup"
  | "squat"
  | "curl"
  | "press"
  | "row"
  | "hinge"
  | "lunge"
  | "generic";

const FAMILY_LABEL: Record<MovementFamily, string> = {
  pushup: "push-up",
  squat: "squat",
  curl: "curl",
  press: "press",
  row: "row / pull",
  hinge: "hinge / deadlift",
  lunge: "lunge",
  generic: "this exercise",
};

/** Distinct move families — high-confidence hits of these block other exercises */
const DISTINCT_FAMILIES: ReadonlySet<MovementFamily> = new Set([
  "pushup",
  "squat",
  "curl",
  "press",
  "row",
  "hinge",
  "lunge",
]);

export function familyLabel(family: MovementFamily): string {
  return FAMILY_LABEL[family];
}

/**
 * Infer expected family from catalog id + name.
 * Order matters: push-up must win over generic "press".
 */
export function resolveExpectedFamily(
  exerciseId: string,
  name?: string,
): MovementFamily {
  const h = `${exerciseId} ${name ?? ""}`.toLowerCase();

  if (/push[-_ ]?up|pushup|press[-_ ]?up|\bplank\b/.test(h)) return "pushup";
  if (/lunge|split[-_ ]squat|bulgarian/.test(h)) return "lunge";
  if (/squat|goblet/.test(h)) return "squat";
  if (/bicep|hammer_curl|barbell_curl|dumbbell_curl|\bcurl\b/.test(h)) {
    return "curl";
  }
  if (
    /row|pull[-_ ]?up|pulldown|lat[-_ ]pulldown|chin[-_ ]?up|face[-_ ]pull|pullup/.test(
      h,
    )
  ) {
    return "row";
  }
  if (/deadlift|rdl|romanian|good[-_ ]morning|hip[-_ ]hinge|kettlebell_swing/.test(h)) {
    return "hinge";
  }
  if (
    /\bpress\b|bench|overhead|shoulder[-_ ]press|chest[-_ ]press|close[-_ ]?grip|floor[-_ ]press|incline[-_ ]press|decline[-_ ]press|military[-_ ]press|dumbbell_press/.test(
      h,
    )
  ) {
    return "press";
  }
  // Still gate these as press-like or curl-like arm paths via generic + strict reject
  if (/lateral[-_ ]raise|front[-_ ]raise|fly|flye|tricep|extension|kickback/.test(h)) {
    return "press";
  }
  if (/plank|crunch|sit[-_ ]?up|leg[-_ ]raise|mountain[-_ ]climber/.test(h)) {
    if (/\bplank\b/.test(h)) return "pushup";
    return "generic";
  }
  return "generic";
}

export type PoseClassification = {
  family: MovementFamily;
  confidence: number;
  /** True only for prone plank / push-up — NOT bench press */
  isPlank: boolean;
  isUpright: boolean;
  /** Horizontal torso on a bench (lying press) */
  isLyingPress: boolean;
};

/** Sticky true-push-up detector (not bench-press). */
let pushupScore = 0;

export function resetPoseClassifierState() {
  pushupScore = 0;
}

function updatePushupSticky(isPushupFrame: boolean): boolean {
  pushupScore = Math.max(
    0,
    Math.min(8, pushupScore + (isPushupFrame ? 1.4 : -1.2)),
  );
  return pushupScore >= 5;
}

/** Live pose → movement family (used to reject wrong exercises). */
export function classifyPose(landmarks: Landmark[]): PoseClassification | null {
  const nose = getLandmark(landmarks, PoseLandmark.NOSE);
  const lShoulder = getLandmark(landmarks, PoseLandmark.LEFT_SHOULDER);
  const rShoulder = getLandmark(landmarks, PoseLandmark.RIGHT_SHOULDER);
  const lHip = getLandmark(landmarks, PoseLandmark.LEFT_HIP);
  const rHip = getLandmark(landmarks, PoseLandmark.RIGHT_HIP);
  const lKnee = getLandmark(landmarks, PoseLandmark.LEFT_KNEE);
  const rKnee = getLandmark(landmarks, PoseLandmark.RIGHT_KNEE);
  const lAnkle = getLandmark(landmarks, PoseLandmark.LEFT_ANKLE);
  const rAnkle = getLandmark(landmarks, PoseLandmark.RIGHT_ANKLE);
  const lElbow = getLandmark(landmarks, PoseLandmark.LEFT_ELBOW);
  const rElbow = getLandmark(landmarks, PoseLandmark.RIGHT_ELBOW);
  const lWrist = getLandmark(landmarks, PoseLandmark.LEFT_WRIST);
  const rWrist = getLandmark(landmarks, PoseLandmark.RIGHT_WRIST);

  if (!lShoulder || !rShoulder || !lHip || !rHip) return null;

  const midShoulder = midPoint(lShoulder, rShoulder);
  const midHip = midPoint(lHip, rHip);
  const midAnkle =
    lAnkle && rAnkle
      ? midPoint(lAnkle, rAnkle)
      : (lAnkle ?? rAnkle ?? null);
  const midWrist =
    lWrist && rWrist
      ? midPoint(lWrist, rWrist)
      : (lWrist ?? rWrist ?? null);

  const torsoDy = midHip.y - midShoulder.y;
  const isUpright = torsoDy > 0.14;
  const isHorizontal = Math.abs(torsoDy) < 0.12;

  // Forward lean (hinge): shoulders ahead of hips in image x, or compressed torso dy
  const torsoLeanDeg = (() => {
    const dx = midShoulder.x - midHip.x;
    const dy = midHip.y - midShoulder.y;
    return (Math.abs(Math.atan2(dx, Math.abs(dy) + 1e-6)) * 180) / Math.PI;
  })();

  const kneeL =
    lHip && lKnee && lAnkle ? angle3Point(lHip, lKnee, lAnkle) : null;
  const kneeR =
    rHip && rKnee && rAnkle ? angle3Point(rHip, rKnee, rAnkle) : null;
  const kneeMin =
    kneeL != null && kneeR != null
      ? Math.min(kneeL, kneeR)
      : (kneeL ?? kneeR);
  const kneeAvg =
    kneeL != null && kneeR != null
      ? (kneeL + kneeR) / 2
      : (kneeL ?? kneeR);
  const kneeAsym =
    kneeL != null && kneeR != null ? Math.abs(kneeL - kneeR) : 0;

  const legsBent = kneeMin != null && kneeMin < 145;
  const legsStraight = kneeAvg != null && kneeAvg > 155;

  const handsUnderShoulders =
    midWrist != null &&
    Math.abs(midWrist.x - midShoulder.x) < 0.12 &&
    Math.abs(midWrist.y - midShoulder.y) < 0.22 &&
    midWrist.y >= midShoulder.y - 0.05;

  const armsOverhead =
    midWrist != null && midWrist.y < midShoulder.y - 0.18;

  /** Curl cue: wrists stay near hips/waist, elbows tucked */
  const wristsLow =
    midWrist != null && midWrist.y > midHip.y - 0.08;

  const elbowsFlared =
    lElbow &&
    rElbow &&
    Math.abs(lElbow.x - rElbow.x) > Math.abs(lShoulder.x - rShoulder.x) * 0.85;

  const faceUpHint =
    nose != null &&
    landmarkScore(nose) > 0.5 &&
    Math.abs(nose.y - midShoulder.y) < 0.15 &&
    !handsUnderShoulders;

  let bodyLine = 180;
  if (midAnkle) {
    bodyLine = angle3Point(midShoulder, midHip, midAnkle);
  }

  const horizontalExtent =
    midAnkle != null
      ? Math.abs(midAnkle.x - midShoulder.x)
      : Math.abs(midHip.x - midShoulder.x);

  const pushupFrame =
    !isUpright &&
    isHorizontal &&
    handsUnderShoulders &&
    !armsOverhead &&
    !legsBent &&
    horizontalExtent > 0.2 &&
    (legsStraight || bodyLine > 145);

  const isPlank = updatePushupSticky(pushupFrame);

  const isLyingPress =
    !isUpright &&
    isHorizontal &&
    !isPlank &&
    (legsBent ||
      faceUpHint ||
      (elbowsFlared && !handsUnderShoulders));

  const elbowL =
    lShoulder && lElbow && lWrist
      ? angle3Point(lShoulder, lElbow, lWrist)
      : null;
  const elbowR =
    rShoulder && rElbow && rWrist
      ? angle3Point(rShoulder, rElbow, rWrist)
      : null;
  const elbow =
    elbowL != null && elbowR != null
      ? (elbowL + elbowR) / 2
      : (elbowL ?? elbowR);

  const torsoVis = Math.min(
    landmarkScore(lShoulder),
    landmarkScore(rShoulder),
    landmarkScore(lHip),
    landmarkScore(rHip),
  );

  if (isPlank) {
    return {
      family: "pushup",
      confidence: Math.min(0.95, 0.7 + torsoVis * 0.25),
      isPlank: true,
      isUpright: false,
      isLyingPress: false,
    };
  }

  if (armsOverhead && (isUpright || torsoDy > 0.05)) {
    return {
      family: "row",
      confidence: 0.82,
      isPlank: false,
      isUpright: true,
      isLyingPress: false,
    };
  }

  if (isLyingPress) {
    return {
      family: "press",
      confidence: 0.85,
      isPlank: false,
      isUpright: false,
      isLyingPress: true,
    };
  }

  // Lunge: upright + big left/right knee asymmetry
  if (isUpright && kneeAsym > 35 && kneeMin != null && kneeMin < 130) {
    return {
      family: "lunge",
      confidence: 0.78,
      isPlank: false,
      isUpright: true,
      isLyingPress: false,
    };
  }

  // Squat: both knees bent together
  if (isUpright && kneeMin != null && kneeMin < 115 && kneeAsym < 28) {
    return {
      family: "squat",
      confidence: 0.8,
      isPlank: false,
      isUpright: true,
      isLyingPress: false,
    };
  }

  // Hinge / RDL: upright-ish with strong torso lean, knees softer bend
  if (
    isUpright &&
    torsoLeanDeg > 32 &&
    kneeAvg != null &&
    kneeAvg > 130 &&
    !armsOverhead
  ) {
    return {
      family: "hinge",
      confidence: 0.76,
      isPlank: false,
      isUpright: true,
      isLyingPress: false,
    };
  }

  // Curl: acute elbow + wrists stay low near torso
  if (isUpright && elbow != null && elbow < 70 && wristsLow) {
    return {
      family: "curl",
      confidence: 0.78,
      isPlank: false,
      isUpright: true,
      isLyingPress: false,
    };
  }

  // Standing / lying press path (wrists not low curl)
  if (elbow != null && elbow < 145 && !armsOverhead && !wristsLow) {
    return {
      family: "press",
      confidence: isUpright ? 0.74 : 0.65,
      isPlank: false,
      isUpright,
      isLyingPress: false,
    };
  }

  // Soft curl mid-rep (elbow bent, wrists mid)
  if (isUpright && elbow != null && elbow < 100 && wristsLow) {
    return {
      family: "curl",
      confidence: 0.68,
      isPlank: false,
      isUpright: true,
      isLyingPress: false,
    };
  }

  if (isUpright) {
    return {
      family: "generic",
      confidence: 0.42,
      isPlank: false,
      isUpright: true,
      isLyingPress: false,
    };
  }

  return {
    family: "generic",
    confidence: 0.35,
    isPlank: false,
    isUpright: false,
    isLyingPress: false,
  };
}

/**
 * Strict cross-exercise gate: high-confidence “other” families never count
 * toward the selected exercise. Idle/setup (generic, low conf) is allowed
 * so athletes can get into position without false red alerts.
 */
export function isPoseCompatible(
  expected: MovementFamily,
  detected: PoseClassification,
): boolean {
  // Floor plank is only valid for push-ups
  if (detected.isPlank && expected !== "pushup") return false;
  if (detected.family === "pushup" && expected !== "pushup") return false;

  // Lying bench only valid for press-family work
  if (detected.isLyingPress && expected !== "press") return false;

  // High-confidence different distinct family → always block
  if (
    detected.confidence >= 0.62 &&
    DISTINCT_FAMILIES.has(detected.family) &&
    detected.family !== expected
  ) {
    // Narrow exceptions for overlapping arm paths
    if (expected === "curl" && detected.family === "press" && detected.isUpright) {
      // Standing press vs curl overlap — allow only soft press conf
      if (detected.confidence < 0.72) return true;
    }
    if (expected === "press" && detected.family === "curl" && detected.isUpright) {
      // Soft curl mid-rep shouldn't kill a press session instantly
      if (detected.confidence < 0.72) return true;
    }
    if (expected === "hinge" && detected.family === "squat") {
      // Soft knee bend during hinge
      if (detected.confidence < 0.75) return true;
    }
    if (expected === "lunge" && detected.family === "squat") {
      if (detected.confidence < 0.75) return true;
    }
    if (expected === "squat" && detected.family === "lunge") {
      if (detected.confidence < 0.75) return true;
    }
    if (expected === "row" && detected.family === "press" && detected.isUpright) {
      // Standing arm bend while setting up a row — soft only
      if (detected.confidence < 0.7) return true;
    }
    return false;
  }

  switch (expected) {
    case "pushup":
      if (detected.isLyingPress) return false;
      if (detected.isUpright && detected.confidence >= 0.55) return false;
      return detected.isPlank || detected.family === "pushup";

    case "press":
      if (detected.family === "row" && detected.confidence >= 0.7) return false;
      if (detected.family === "squat" && detected.confidence >= 0.65) return false;
      if (detected.family === "hinge" && detected.confidence >= 0.7) return false;
      if (detected.family === "lunge" && detected.confidence >= 0.7) return false;
      return true;

    case "squat":
      if (!detected.isUpright && detected.confidence >= 0.5) return false;
      if (detected.family === "curl" && detected.confidence >= 0.68) return false;
      if (detected.family === "row" && detected.confidence >= 0.7) return false;
      if (detected.family === "press" && detected.confidence >= 0.72) return false;
      if (detected.family === "hinge" && detected.confidence >= 0.75) return false;
      return detected.isUpright;

    case "curl":
      if (!detected.isUpright && detected.confidence >= 0.5) return false;
      if (detected.family === "squat" && detected.confidence >= 0.65) return false;
      if (detected.family === "row" && detected.confidence >= 0.7) return false;
      if (detected.family === "lunge" && detected.confidence >= 0.7) return false;
      if (detected.family === "hinge" && detected.confidence >= 0.7) return false;
      return detected.isUpright;

    case "row":
      if (detected.family === "squat" && detected.confidence >= 0.65) return false;
      if (detected.family === "curl" && detected.confidence >= 0.7) return false;
      if (detected.family === "lunge" && detected.confidence >= 0.7) return false;
      if (detected.family === "hinge" && detected.confidence >= 0.75) return false;
      // Pull-ups / rows need upright or hang — not floor work
      return (
        detected.family === "row" ||
        detected.isUpright ||
        detected.family === "generic"
      );

    case "hinge":
      if (detected.family === "curl" && detected.confidence >= 0.7) return false;
      if (detected.family === "row" && detected.confidence >= 0.75) return false;
      if (detected.family === "press" && detected.confidence >= 0.75) return false;
      return detected.isUpright || detected.family === "hinge";

    case "lunge":
      if (detected.family === "curl" && detected.confidence >= 0.7) return false;
      if (detected.family === "row" && detected.confidence >= 0.75) return false;
      if (detected.family === "press" && detected.confidence >= 0.75) return false;
      return detected.isUpright || detected.family === "lunge";

    case "generic":
      // Any clear other exercise → block; idle/setup OK
      if (
        detected.confidence >= 0.68 &&
        DISTINCT_FAMILIES.has(detected.family)
      ) {
        return false;
      }
      return true;

    default:
      return true;
  }
}

export function mismatchCue(
  expected: MovementFamily,
  detected: MovementFamily,
  exerciseName: string,
): string {
  if (expected === "press" && detected === "pushup") {
    return `That looks like a push-up — for ${exerciseName}, keep your back on the bench and press the dumbbells`;
  }
  if (expected === "pushup" && (detected === "press" || detected === "generic")) {
    return "Get into a plank push-up position — hands under shoulders, legs straight";
  }
  if (expected === "squat" && detected === "pushup") {
    return "Stand up for your squat — that looks like a floor movement";
  }
  if (expected === "curl" && detected === "squat") {
    return `Stand tall and curl — that looks like a squat, not ${exerciseName}`;
  }
  if (expected === "press" && detected === "squat") {
    return `That looks like a squat — for ${exerciseName}, press the weights instead`;
  }
  if (expected === "press" && detected === "curl") {
    return `That looks like a curl — for ${exerciseName}, press the weights instead`;
  }
  if (expected === "row" && detected === "pushup") {
    return `That looks like a push-up — for ${exerciseName}, hang and pull your chest to the bar`;
  }
  if (expected === "squat" && detected === "curl") {
    return `That looks like a curl — for ${exerciseName}, keep arms still and squat`;
  }
  if (expected === "curl" && detected === "press") {
    return `That looks like a press — for ${exerciseName}, pin elbows and curl`;
  }
  if (expected === "hinge" && detected === "squat") {
    return `More hip hinge, less squat — push hips back for ${exerciseName}`;
  }
  if (expected === "lunge" && detected === "squat") {
    return `Step into a split stance — that looks like a squat, not ${exerciseName}`;
  }
  if (detected === "pushup") {
    return `That looks like a push-up — switch back to your ${exerciseName}`;
  }
  if (detected === "squat") {
    return `That looks like a squat — switch back to your ${exerciseName}`;
  }
  if (detected === "curl") {
    return `That looks like a curl — switch back to your ${exerciseName}`;
  }
  return `That looks like a ${familyLabel(detected)} — switch to your ${exerciseName}`;
}
