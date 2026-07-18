import { z } from "zod";

export const userProfileSchema = z.object({
  goal: z.enum(["muscle_gain", "fat_loss", "general_fitness", "strength"]),
  level: z.enum(["beginner", "intermediate", "expert"]),
  daysPerWeek: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  equipment: z.array(z.string()).min(1),
  sessionMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  ageRange: z.enum(["18-24", "25-34", "35-44", "45+"]).optional(),
  sex: z.enum(["male", "female", "prefer_not"]).optional(),
  trainingLocation: z.enum(["home", "gym", "both"]).optional(),
  limitations: z.array(z.string()).default([]),
  focusAreas: z.array(z.string()).default([]),
  motivation: z.string().max(200).optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.number().int().min(1).max(8),
  reps: z.string(),
  restSec: z.number().int().min(30).max(300),
  notes: z.string().optional(),
});

export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;

export const dayWorkoutSchema = z.object({
  exercises: z.array(workoutExerciseSchema).min(0).max(10),
  coachTip: z.string().optional(),
});

export type DayWorkout = z.infer<typeof dayWorkoutSchema>;

export type SkeletonDay = {
  dayNumber: number;
  weekNumber: number;
  focus: string;
  isRestDay: boolean;
  label: string;
};

export type PlanSkeleton = {
  splitType: string;
  days: SkeletonDay[];
};

export type EnrichedWorkoutExercise = WorkoutExercise & {
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  imageUrls: string[];
  equipment: string | null;
  mechanic: string | null;
};

export type EnrichedDayWorkout = {
  exercises: EnrichedWorkoutExercise[];
  coachTip?: string;
  aiGenerated?: boolean;
};

export type ExerciseCandidate = {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string | null;
  mechanic: string | null;
  level: string;
  category: string;
};

export type DayGenerationResult = {
  workout: DayWorkout;
  aiGenerated: boolean;
};
