import type { UserProfile } from "@/backend/types/plan.types";

export type DayFocus = {
  focus: string;
  isRestDay: boolean;
  muscles: string[];
};

const SPLITS: Record<number, { splitType: string; weekPattern: DayFocus[] }> = {
  3: {
    splitType: "Full Body",
    weekPattern: [
      { focus: "Full Body A", isRestDay: false, muscles: ["chest", "quadriceps", "lats", "shoulders"] },
      { focus: "Rest", isRestDay: true, muscles: [] },
      { focus: "Full Body B", isRestDay: false, muscles: ["middle back", "hamstrings", "shoulders", "biceps"] },
      { focus: "Rest", isRestDay: true, muscles: [] },
      { focus: "Full Body C", isRestDay: false, muscles: ["chest", "glutes", "triceps", "abdominals"] },
      { focus: "Rest", isRestDay: true, muscles: [] },
      { focus: "Rest", isRestDay: true, muscles: [] },
    ],
  },
  4: {
    splitType: "Upper / Lower",
    weekPattern: [
      { focus: "Upper A", isRestDay: false, muscles: ["chest", "lats", "shoulders", "biceps", "triceps"] },
      { focus: "Lower A", isRestDay: false, muscles: ["quadriceps", "hamstrings", "glutes", "calves"] },
      { focus: "Rest", isRestDay: true, muscles: [] },
      { focus: "Upper B", isRestDay: false, muscles: ["chest", "middle back", "shoulders", "triceps", "biceps"] },
      { focus: "Lower B", isRestDay: false, muscles: ["quadriceps", "hamstrings", "glutes", "abdominals"] },
      { focus: "Rest", isRestDay: true, muscles: [] },
      { focus: "Rest", isRestDay: true, muscles: [] },
    ],
  },
  5: {
    splitType: "Push / Pull / Legs",
    weekPattern: [
      { focus: "Push", isRestDay: false, muscles: ["chest", "shoulders", "triceps"] },
      { focus: "Pull", isRestDay: false, muscles: ["lats", "middle back", "biceps"] },
      { focus: "Legs", isRestDay: false, muscles: ["quadriceps", "hamstrings", "glutes", "calves"] },
      { focus: "Upper", isRestDay: false, muscles: ["chest", "lats", "shoulders", "biceps", "triceps"] },
      { focus: "Lower", isRestDay: false, muscles: ["quadriceps", "hamstrings", "glutes", "abdominals"] },
      { focus: "Rest", isRestDay: true, muscles: [] },
      { focus: "Rest", isRestDay: true, muscles: [] },
    ],
  },
  6: {
    splitType: "PPL x2",
    weekPattern: [
      { focus: "Push A", isRestDay: false, muscles: ["chest", "shoulders", "triceps"] },
      { focus: "Pull A", isRestDay: false, muscles: ["lats", "middle back", "biceps"] },
      { focus: "Legs A", isRestDay: false, muscles: ["quadriceps", "hamstrings", "glutes", "calves"] },
      { focus: "Push B", isRestDay: false, muscles: ["chest", "shoulders", "triceps"] },
      { focus: "Pull B", isRestDay: false, muscles: ["lats", "middle back", "traps", "biceps"] },
      { focus: "Legs B", isRestDay: false, muscles: ["quadriceps", "hamstrings", "glutes", "abdominals"] },
      { focus: "Rest", isRestDay: true, muscles: [] },
    ],
  },
};

export function getSplitForProfile(profile: UserProfile) {
  return SPLITS[profile.daysPerWeek] ?? SPLITS[3];
}

export function getDayFocus(profile: UserProfile, dayNumber: number): DayFocus {
  const { weekPattern } = getSplitForProfile(profile);
  const index = (dayNumber - 1) % 7;
  return weekPattern[index];
}
