import type { Goal, UserProfile } from "@/modules/plan/types";

export type GoalAffirmation = {
  becoming: string;
  preLine: string;
  postCore: string;
};

export const GOAL_AFFIRMATIONS: Record<Goal, GoalAffirmation> = {
  fat_loss: {
    becoming: "Leaner & Fitter",
    preLine: "Every rep today builds a healthier, more energetic you.",
    postCore: "You showed up to become fitter — and you did.",
  },
  muscle_gain: {
    becoming: "Stronger & More Capable",
    preLine: "Every set today helps you grow into a powerful, capable body.",
    postCore: "You came to build a stronger body — and you put in real work.",
  },
  strength: {
    becoming: "Stronger",
    preLine: "Every lift today unlocks more of the strength already in you.",
    postCore: "Strength is built by showing up — and you showed up today.",
  },
  general_fitness: {
    becoming: "Fitter",
    preLine: "Every move today keeps you active, energized, and alive.",
    postCore: "You chose to become fitter today — that choice changes everything.",
  },
};

export const DEFAULT_AFFIRMATION: GoalAffirmation = {
  becoming: "Fitter & Stronger",
  preLine: "Every rep today moves you toward the best version of you.",
  postCore: "You showed up — that's how the best version of you gets built.",
};

const FOCUS_AFFIRMATIONS: Record<string, string> = {
  upper: "Today you're investing in upper-body strength.",
  lower: "Today you're building strength from the ground up.",
  core: "Today you're building the core that supports everything.",
  full: "Today you're training your whole body — balanced and complete.",
};

export function getGoalAffirmation(profile: UserProfile | null): GoalAffirmation {
  if (!profile?.goal) return DEFAULT_AFFIRMATION;
  return GOAL_AFFIRMATIONS[profile.goal] ?? DEFAULT_AFFIRMATION;
}

export function getFocusLine(profile: UserProfile | null): string | null {
  const focus = profile?.focusAreas?.[0] ?? "full";
  return FOCUS_AFFIRMATIONS[focus] ?? FOCUS_AFFIRMATIONS.full;
}

export function getMotivationLine(profile: UserProfile | null): string | null {
  const text = profile?.motivation?.trim();
  if (!text) return null;
  return text;
}
