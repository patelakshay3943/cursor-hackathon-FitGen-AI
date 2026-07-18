import OpenAI from "openai";
import type {
  DayGenerationResult,
  DayWorkout,
  ExerciseCandidate,
  UserProfile,
} from "@/backend/types/plan.types";
import { dayWorkoutSchema } from "@/backend/types/plan.types";
import type { DayFocus } from "./split-template.service";

function getApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "sk-..." || key.length < 20) return null;
  return key;
}

function getClient() {
  const key = getApiKey();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getApiKey());
}

function exerciseCountForSession(minutes: number): { min: number; max: number } {
  if (minutes <= 30) return { min: 3, max: 4 };
  if (minutes <= 45) return { min: 4, max: 5 };
  return { min: 5, max: 6 };
}

function fallbackDayWorkout(
  candidates: ExerciseCandidate[],
  focus: DayFocus,
  profile: UserProfile,
): DayWorkout {
  const { max } = exerciseCountForSession(profile.sessionMinutes);
  const muscleSet = new Set(focus.muscles.map((m) => m.toLowerCase()));
  const limited = new Set((profile.limitations ?? []).map((l) => l.toLowerCase()));

  const matching = candidates.filter((c) => {
    const muscles = c.primaryMuscles.map((m) => m.toLowerCase());
    if (limited.has("knees") && muscles.some((m) => ["quadriceps", "hamstrings", "calves"].includes(m))) {
      // still allow but prefer non-impact later — keep for fallback pool
    }
    if (limited.has("shoulders") && muscles.includes("shoulders") && c.mechanic === "compound") {
      return false;
    }
    if (limited.has("back") && muscles.includes("lower back")) return false;
    return muscles.some((m) => muscleSet.has(m));
  });

  const pool = matching.length >= 3 ? matching : candidates;
  const picked = pool.slice(0, max);

  const reps =
    profile.goal === "muscle_gain"
      ? "8-12"
      : profile.goal === "fat_loss"
        ? "12-15"
        : profile.goal === "strength"
          ? "5-8"
          : "10-12";

  return {
    exercises: picked.map((ex, i) => ({
      exerciseId: ex.id,
      sets: profile.level === "beginner" ? 3 : profile.goal === "strength" ? 5 : 4,
      reps,
      restSec: profile.goal === "strength" ? (i === 0 ? 180 : 120) : i === 0 ? 120 : 90,
    })),
    coachTip: "Generated with local rules (OpenAI unavailable).",
  };
}

function profileSummary(profile: UserProfile): string {
  return [
    `goal=${profile.goal}`,
    `level=${profile.level}`,
    `daysPerWeek=${profile.daysPerWeek}`,
    `sessionMinutes=${profile.sessionMinutes}`,
    `equipment=${profile.equipment.join(",")}`,
    profile.ageRange ? `ageRange=${profile.ageRange}` : null,
    profile.sex && profile.sex !== "prefer_not" ? `sex=${profile.sex}` : null,
    profile.trainingLocation ? `location=${profile.trainingLocation}` : null,
    profile.limitations?.length ? `limitations=${profile.limitations.join(",")}` : "limitations=none",
    profile.focusAreas?.length ? `focusAreas=${profile.focusAreas.join(",")}` : null,
    profile.motivation ? `motivation=${profile.motivation}` : null,
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * Generate one day's workout using OpenAI from DB candidate exercises.
 * Falls back to local rules only if the API key is missing or the call fails.
 */
export async function generateDayWorkout(params: {
  profile: UserProfile;
  focus: DayFocus;
  candidates: ExerciseCandidate[];
  priorExerciseNames: string[];
  dayNumber: number;
  requireAi?: boolean;
}): Promise<DayGenerationResult> {
  const { profile, focus, candidates, priorExerciseNames, dayNumber, requireAi } = params;

  if (focus.isRestDay) {
    return {
      workout: { exercises: [], coachTip: "Rest and recover. Light walk or mobility is optional." },
      aiGenerated: false,
    };
  }

  const client = getClient();
  if (!client) {
    if (requireAi) {
      throw new Error(
        "OPENAI_API_KEY is missing or invalid. Add your key to .env and restart the server.",
      );
    }
    return {
      workout: fallbackDayWorkout(candidates, focus, profile),
      aiGenerated: false,
    };
  }

  const { min, max } = exerciseCountForSession(profile.sessionMinutes);
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const candidatePayload = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    muscles: c.primaryMuscles,
    secondary: c.secondaryMuscles,
    equipment: c.equipment,
    mechanic: c.mechanic,
    level: c.level,
  }));

  const system = `You are FitGen AI, a certified strength & conditioning coach.
Rules:
1. Pick exercises ONLY from the candidate list. Use exact "id" as exerciseId.
2. Never invent exercise names or IDs.
3. Respect injuries/limitations — avoid high-risk movements for listed areas.
4. Match the day's focus muscles; order compounds before isolation.
5. Scale volume to session length and experience level.
6. Return JSON only.`;

  const user = `Create Day ${dayNumber} workout from the exercise database candidates.

Athlete profile: ${profileSummary(profile)}
Day focus: ${focus.focus}
Target muscles: ${focus.muscles.join(", ") || "full body"}
Exercise count: ${min}-${max}

Avoid repeating these recent exercises when possible:
${priorExerciseNames.slice(-24).join(", ") || "none"}

Candidates (from database):
${JSON.stringify(candidatePayload)}

Return JSON:
{
  "exercises": [
    { "exerciseId": "Exact_Id_From_Candidates", "sets": 3, "reps": "8-12", "restSec": 90, "notes": "optional cue" }
  ],
  "coachTip": "One short motivational coaching tip for this session"
}`;

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      if (requireAi) throw new Error("OpenAI returned an empty response.");
      return { workout: fallbackDayWorkout(candidates, focus, profile), aiGenerated: false };
    }

    const parsed = JSON.parse(content) as unknown;
    const result = dayWorkoutSchema.safeParse(parsed);
    if (!result.success) {
      if (requireAi) throw new Error("OpenAI returned invalid workout JSON.");
      return { workout: fallbackDayWorkout(candidates, focus, profile), aiGenerated: false };
    }

    return { workout: result.data, aiGenerated: true };
  } catch (err) {
    console.error("OpenAI day generation failed:", err);
    if (requireAi) {
      throw err instanceof Error
        ? err
        : new Error("OpenAI generation failed. Check your API key and quota.");
    }
    return { workout: fallbackDayWorkout(candidates, focus, profile), aiGenerated: false };
  }
}
