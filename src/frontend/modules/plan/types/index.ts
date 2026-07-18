export type Goal = "muscle_gain" | "fat_loss" | "general_fitness" | "strength";
export type Level = "beginner" | "intermediate" | "expert";
export type SessionMinutes = 30 | 45 | 60;
export type DaysPerWeek = 3 | 4 | 5 | 6;
export type AgeRange = "18-24" | "25-34" | "35-44" | "45+";
export type Sex = "male" | "female" | "prefer_not";
export type TrainingLocation = "home" | "gym" | "both";

export type UserProfile = {
  goal: Goal;
  level: Level;
  daysPerWeek: DaysPerWeek;
  equipment: string[];
  sessionMinutes: SessionMinutes;
  ageRange?: AgeRange;
  sex?: Sex;
  trainingLocation?: TrainingLocation;
  limitations: string[];
  focusAreas: string[];
  motivation?: string;
};

export type WorkoutExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
  restSec: number;
  notes?: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  imageUrls: string[];
  equipment: string | null;
  mechanic: string | null;
};

export type DayWorkout = {
  exercises: WorkoutExercise[];
  coachTip?: string;
  aiGenerated?: boolean;
};

export type PlanDayStatus = "locked" | "generating" | "ready" | "completed";

export type PlanDay = {
  id: string;
  dayNumber: number;
  weekNumber: number;
  focus: string;
  isRestDay: boolean;
  status: PlanDayStatus;
  workout: DayWorkout | null;
  generatedAt: string | null;
  completedAt: string | null;
};

export type PlanResponse = {
  planId: string;
  currentDay: number;
  splitType: string;
  startDate: string;
  skeleton: unknown;
  profile: UserProfile;
  createdAt?: string;
  days: PlanDay[];
  day1?: PlanDay;
  unlockedDay?: PlanDay | null;
  message?: string;
};

export const PLAN_STORAGE_KEY = "fitgen_plan_id";
export const PLAN_STORAGE_EVENT = "fitgen-plan-updated";

export function savePlanId(planId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_STORAGE_KEY, planId);
  window.dispatchEvent(new Event(PLAN_STORAGE_EVENT));
}

export function getStoredPlanId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAN_STORAGE_KEY);
}

export const GOAL_OPTIONS = [
  {
    value: "muscle_gain" as const,
    label: "Build muscle",
    description: "Hypertrophy-focused training with progressive volume",
  },
  {
    value: "fat_loss" as const,
    label: "Lose fat",
    description: "Higher-rep circuits that keep heart rate elevated",
  },
  {
    value: "strength" as const,
    label: "Get stronger",
    description: "Lower-rep compound lifts with longer rest",
  },
  {
    value: "general_fitness" as const,
    label: "Stay fit",
    description: "Balanced full-body conditioning and strength",
  },
];

export const LEVEL_OPTIONS = [
  {
    value: "beginner" as const,
    label: "Beginner",
    description: "New to lifting or returning after a long break",
  },
  {
    value: "intermediate" as const,
    label: "Intermediate",
    description: "Consistent training for 6+ months",
  },
  {
    value: "expert" as const,
    label: "Advanced",
    description: "Comfortable with complex lifts and programming",
  },
];

export const EQUIPMENT_OPTIONS = [
  { value: "bodyweight", label: "Bodyweight", hint: "No gear needed" },
  { value: "dumbbell", label: "Dumbbells", hint: "Adjustable or fixed" },
  { value: "barbell", label: "Barbell", hint: "Rack / plates" },
  { value: "cable", label: "Cables", hint: "Cable machine" },
  { value: "machine", label: "Machines", hint: "Gym machines" },
  { value: "kettlebells", label: "Kettlebells", hint: "Any weight" },
  { value: "bands", label: "Bands", hint: "Resistance bands" },
  { value: "full gym", label: "Full gym", hint: "Access to everything" },
] as const;

export const LIMITATION_OPTIONS = [
  { value: "none", label: "No limitations" },
  { value: "knees", label: "Knees" },
  { value: "back", label: "Lower back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "wrists", label: "Wrists" },
  { value: "hips", label: "Hips" },
] as const;

export const FOCUS_OPTIONS = [
  { value: "upper", label: "Upper body" },
  { value: "lower", label: "Lower body" },
  { value: "core", label: "Core" },
  { value: "full", label: "Balanced / full body" },
] as const;

export const ASSESSMENT_STEPS = [
  { id: 1, title: "Goal", subtitle: "What do you want to achieve?" },
  { id: 2, title: "Schedule", subtitle: "How often and how long can you train?" },
  { id: 3, title: "You", subtitle: "Experience, body, and any limitations" },
  { id: 4, title: "Gear", subtitle: "Where you train and what you have" },
  { id: 5, title: "Review", subtitle: "Confirm and generate Day 1 with AI" },
] as const;
