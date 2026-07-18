import { createBicepCurlTracker } from "./bicepCurl";
import { createGenericTracker } from "./generic";
import { createHingeTracker } from "./hinge";
import { createLungeTracker } from "./lunge";
import {
  resolveExpectedFamily,
  type MovementFamily,
} from "./movementFamily";
import { createPlankTracker } from "./plank";
import { createPressTracker } from "./press";
import { createPushupTracker } from "./pushup";
import { createRowTracker } from "./row";
import { createSquatTracker } from "./squat";
import type { ExerciseTracker, TrackerFactory } from "./types";

type RegistryEntry = {
  key: string;
  label: string;
  patterns: RegExp[];
  create: TrackerFactory;
  precise: boolean;
  family: MovementFamily;
};

const REGISTRY: RegistryEntry[] = [
  {
    key: "squat",
    label: "Squat",
    precise: true,
    family: "squat",
    patterns: [/squat/i, /bodyweight_squat/i, /goblet/i, /barbell_full_squat/i],
    create: createSquatTracker,
  },
  {
    key: "pushup",
    label: "Push-up",
    precise: true,
    family: "pushup",
    patterns: [/push[-_ ]?up/i, /pushup/i, /press[-_ ]?up/i],
    create: createPushupTracker,
  },
  {
    key: "plank",
    label: "Plank",
    precise: true,
    family: "pushup",
    patterns: [/\bplank\b/i],
    create: createPlankTracker,
  },
  {
    key: "bicep_curl",
    label: "Bicep Curl",
    precise: true,
    family: "curl",
    patterns: [
      /bicep[-_ ]?curl/i,
      /hammer_curl/i,
      /barbell_curl/i,
      /dumbbell_curl/i,
      /alternate_hammer/i,
      /\bcurl\b/i,
    ],
    create: createBicepCurlTracker,
  },
  {
    key: "press",
    label: "Press",
    precise: true,
    family: "press",
    patterns: [
      /\bpress\b/i,
      /bench/i,
      /overhead/i,
      /shoulder[-_ ]press/i,
      /chest[-_ ]press/i,
      /close[-_ ]?grip/i,
      /floor[-_ ]press/i,
    ],
    create: () => createPressTracker("Press"),
  },
  {
    key: "row",
    label: "Row / Pull-up",
    precise: true,
    family: "row",
    patterns: [
      /row/i,
      /pull[-_ ]?up/i,
      /pulldown/i,
      /lat[-_ ]pulldown/i,
      /chin[-_ ]?up/i,
      /face[-_ ]pull/i,
      /pullup/i,
    ],
    create: () => createRowTracker("Row / Pull-up"),
  },
  {
    key: "lunge",
    label: "Lunge",
    precise: true,
    family: "lunge",
    patterns: [/lunge/i, /split[-_ ]squat/i, /bulgarian/i],
    create: createLungeTracker,
  },
  {
    key: "hinge",
    label: "Hip Hinge",
    precise: true,
    family: "hinge",
    patterns: [
      /deadlift/i,
      /rdl/i,
      /romanian/i,
      /good[-_ ]morning/i,
      /hip[-_ ]hinge/i,
      /kettlebell_swing/i,
    ],
    create: () => createHingeTracker("Hip Hinge"),
  },
];

export function resolveTrackerKey(
  exerciseId: string,
  name?: string,
): string {
  const haystack = `${exerciseId} ${name ?? ""}`.toLowerCase();

  const ordered = [
    "plank",
    "pushup",
    "lunge",
    "squat",
    "row",
    "hinge",
    "bicep_curl",
    "press",
  ] as const;

  for (const key of ordered) {
    const entry = REGISTRY.find((e) => e.key === key)!;
    if (!entry.patterns.some((p) => p.test(haystack))) continue;
    if (
      entry.key === "pushup" &&
      /\bpress\b/i.test(haystack) &&
      !/press[-_ ]?up/i.test(haystack)
    ) {
      continue;
    }
    return entry.key;
  }
  return "generic";
}

export function isTrackable(_exerciseId?: string, _name?: string): boolean {
  return true;
}

export function isPreciseTracker(
  exerciseId: string,
  name?: string,
): boolean {
  const key = resolveTrackerKey(exerciseId, name);
  return REGISTRY.some((e) => e.key === key && e.precise);
}

/** Setup tips shown before counting starts */
export function getSetupTips(
  exerciseId: string,
  name?: string,
): { tip: string; startPose: string } {
  const key = resolveTrackerKey(exerciseId, name);
  switch (key) {
    case "squat":
      return {
        tip: "Camera in front or ¾ angle · full body in frame",
        startPose: "Stand tall, feet shoulder-width — hold still",
      };
    case "pushup":
      return {
        tip: "Camera from the side · full plank visible",
        startPose: "High plank — hands under shoulders, hold",
      };
    case "plank":
      return {
        tip: "Side angle works best · body in one straight line",
        startPose: "Hold a solid plank — we'll count every 5 seconds",
      };
    case "bicep_curl":
      return {
        tip: "Face the camera · show one arm clearly",
        startPose: "Arms at sides, elbows pinned — hold ready",
      };
    case "press":
      return {
        tip: "Bench: side camera · Standing press: face camera",
        startPose: "Weights at start position — hold steady",
      };
    case "row":
      return {
        tip: "Pull-ups: face or slight angle · Rows: side-on",
        startPose: "Hang or hinge ready — arms long, hold",
      };
    case "lunge":
      return {
        tip: "¾ camera angle · both legs visible",
        startPose: "Split stance — hold before you lower",
      };
    case "hinge":
      return {
        tip: "Side camera so we see hip push-back",
        startPose: "Soft knees, tall spine — hold before hinging",
      };
    default:
      return {
        tip: "Step back · full body visible · good lighting",
        startPose: "Take your starting pose and hold still",
      };
  }
}

export function createTrackerForExercise(
  exerciseId: string,
  name?: string,
): ExerciseTracker {
  const key = resolveTrackerKey(exerciseId, name);
  const displayName = name?.trim() || "Exercise";
  const family = resolveExpectedFamily(exerciseId, name);

  if (key === "plank") return createPlankTracker();
  if (key === "pushup" || family === "pushup") return createPushupTracker();
  if (key === "lunge" || family === "lunge") return createLungeTracker();
  if (key === "squat" || family === "squat") return createSquatTracker();
  if (key === "row" || family === "row") {
    return createRowTracker(displayName);
  }
  if (key === "hinge" || family === "hinge") {
    return createHingeTracker(displayName);
  }
  if (key === "bicep_curl" || family === "curl") return createBicepCurlTracker();
  if (key === "press" || family === "press") {
    return createPressTracker(displayName, "press");
  }

  return createGenericTracker(displayName, family);
}

export function listTrackableLabels(): string[] {
  return REGISTRY.filter((e) => e.precise).map((e) => e.label);
}
