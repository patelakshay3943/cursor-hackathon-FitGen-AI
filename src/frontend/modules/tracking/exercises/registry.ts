import { createBicepCurlTracker } from "./bicepCurl";
import { createGenericTracker } from "./generic";
import {
  resolveExpectedFamily,
  type MovementFamily,
} from "./movementFamily";
import { createPressTracker } from "./press";
import { createPushupTracker } from "./pushup";
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
    patterns: [
      /squat/i,
      /bodyweight_squat/i,
      /goblet/i,
      /barbell_full_squat/i,
      /barbell_squat/i,
    ],
    create: createSquatTracker,
  },
  {
    key: "pushup",
    label: "Push-up",
    precise: true,
    family: "pushup",
    // Must not match "dumbbell press" / "close-grip press"
    patterns: [/push[-_ ]?up/i, /pushup/i, /press[-_ ]?up/i],
    create: createPushupTracker,
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
      /alternate_incline_dumbbell_curl/i,
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
      /incline[-_ ]press/i,
      /decline[-_ ]press/i,
    ],
    create: () => createPressTracker("Press"),
  },
];

export function resolveTrackerKey(
  exerciseId: string,
  name?: string,
): string {
  const haystack = `${exerciseId} ${name ?? ""}`.toLowerCase();

  // Push-up before press so "press-up" stays push-up; dumbbell press hits press.
  const ordered = [
    REGISTRY.find((e) => e.key === "pushup")!,
    REGISTRY.find((e) => e.key === "squat")!,
    REGISTRY.find((e) => e.key === "bicep_curl")!,
    REGISTRY.find((e) => e.key === "press")!,
  ];

  for (const entry of ordered) {
    if (entry.patterns.some((p) => p.test(haystack))) {
      // Guard: "close-grip … press" must not become push-up
      if (entry.key === "pushup" && /\bpress\b/i.test(haystack) && !/press[-_ ]?up/i.test(haystack)) {
        continue;
      }
      return entry.key;
    }
  }
  return "generic";
}

/** Every exercise can open the camera; precise FSMs exist for a subset. */
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

export function createTrackerForExercise(
  exerciseId: string,
  name?: string,
): ExerciseTracker {
  const key = resolveTrackerKey(exerciseId, name);
  const displayName = name?.trim() || "Exercise";
  const family = resolveExpectedFamily(exerciseId, name);

  // Precise FSMs for known patterns; every path still runs wrongExerciseGate
  if (key === "pushup" || family === "pushup") {
    return createPushupTracker();
  }
  if (key === "squat" || family === "squat") {
    return createSquatTracker();
  }
  if (key === "bicep_curl" || family === "curl") {
    return createBicepCurlTracker();
  }
  if (key === "press" || family === "press") {
    return createPressTracker(displayName, "press");
  }

  // row / hinge / lunge / generic — gated generic tracker
  return createGenericTracker(displayName, family);
}

export function listTrackableLabels(): string[] {
  return [...REGISTRY.map((e) => e.label), "All other exercises (gated generic)"];
}
