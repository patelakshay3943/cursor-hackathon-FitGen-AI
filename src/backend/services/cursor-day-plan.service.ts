import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  DayGenerationResult,
  DayWorkout,
  ExerciseCandidate,
  UserProfile,
} from "@/backend/types/plan.types";
import { dayWorkoutSchema } from "@/backend/types/plan.types";
import type { DayFocus } from "./split-template.service";

async function loadCursorSdk() {
  // Dynamic import keeps @cursor/sdk off the client graph and pairs with
  // next.config serverExternalPackages.
  return import("@cursor/sdk");
}

function getApiKey(): string | null {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key || key === "cursor_..." || key.length < 20) return null;
  return key;
}

function getModelId(): string {
  return process.env.CURSOR_MODEL?.trim() || "composer-2.5";
}

export function isCursorConfigured(): boolean {
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
    coachTip: "Generated with local rules (Cursor unavailable).",
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

/** Pull a JSON object from agent text (raw or fenced). */
export function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fence?.[1] ?? trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

function buildPrompt(params: {
  profile: UserProfile;
  focus: DayFocus;
  candidates: ExerciseCandidate[];
  priorExerciseNames: string[];
  dayNumber: number;
  min: number;
  max: number;
}): string {
  const { profile, focus, candidates, priorExerciseNames, dayNumber, min, max } =
    params;

  const candidatePayload = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    muscles: c.primaryMuscles,
    secondary: c.secondaryMuscles,
    equipment: c.equipment,
    mechanic: c.mechanic,
    level: c.level,
  }));

  return `You are FitGen AI, a certified strength & conditioning coach.

CRITICAL INSTRUCTIONS:
- Do NOT edit, create, or delete any files.
- Do NOT use tools. Do NOT explore the filesystem.
- Reply with a single JSON object only — no markdown, no prose before/after.

Rules:
1. Pick exercises ONLY from the candidate list. Use exact "id" as exerciseId.
2. Never invent exercise names or IDs.
3. Respect injuries/limitations — avoid high-risk movements for listed areas.
4. Match the day's focus muscles; order compounds before isolation.
5. Scale volume to session length and experience level.

Create Day ${dayNumber} workout from the exercise database candidates.

Athlete profile: ${profileSummary(profile)}
Day focus: ${focus.focus}
Target muscles: ${focus.muscles.join(", ") || "full body"}
Exercise count: ${min}-${max}

Avoid repeating these recent exercises when possible:
${priorExerciseNames.slice(-24).join(", ") || "none"}

Candidates (from database):
${JSON.stringify(candidatePayload)}

Return exactly this JSON shape:
{
  "exercises": [
    { "exerciseId": "Exact_Id_From_Candidates", "sets": 3, "reps": "8-12", "restSec": 90, "notes": "optional cue" }
  ],
  "coachTip": "One short motivational coaching tip for this session"
}`;
}

/**
 * Generate one day's workout using a Cursor model via the Cursor SDK.
 * Falls back to local rules if the API key is missing or the agent fails.
 */
export async function generateDayWorkout(params: {
  profile: UserProfile;
  focus: DayFocus;
  candidates: ExerciseCandidate[];
  priorExerciseNames: string[];
  dayNumber: number;
  requireAi?: boolean;
}): Promise<DayGenerationResult> {
  const { profile, focus, candidates, priorExerciseNames, dayNumber, requireAi } =
    params;

  if (focus.isRestDay) {
    return {
      workout: {
        exercises: [],
        coachTip: "Rest and recover. Light walk or mobility is optional.",
      },
      aiGenerated: false,
    };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    if (requireAi) {
      throw new Error(
        "CURSOR_API_KEY is missing or invalid. Add your key to .env (Cursor Dashboard → Integrations) and restart the server.",
      );
    }
    return {
      workout: fallbackDayWorkout(candidates, focus, profile),
      aiGenerated: false,
    };
  }

  const { min, max } = exerciseCountForSession(profile.sessionMinutes);
  const prompt = buildPrompt({
    profile,
    focus,
    candidates,
    priorExerciseNames,
    dayNumber,
    min,
    max,
  });

  let tempDir: string | null = null;

  try {
    const { Agent, CursorAgentError } = await loadCursorSdk();

    tempDir = await mkdtemp(join(tmpdir(), "fitgen-cursor-"));
    // Empty workspace so the agent has nowhere useful to edit in the app repo.
    await writeFile(
      join(tempDir, "README.txt"),
      "FitGen ephemeral workspace. Do not edit files. Reply with JSON only.\n",
      "utf8",
    );

    const run = await Agent.prompt(prompt, {
      apiKey,
      model: { id: getModelId() },
      local: { cwd: tempDir },
    });

    if (run.status === "error") {
      const message = run.error?.message ?? "Cursor agent run failed";
      if (requireAi) throw new Error(message);
      console.error("Cursor day generation run error:", message);
      return {
        workout: fallbackDayWorkout(candidates, focus, profile),
        aiGenerated: false,
      };
    }

    const content = run.result?.trim();
    if (!content) {
      if (requireAi) throw new Error("Cursor agent returned an empty response.");
      return {
        workout: fallbackDayWorkout(candidates, focus, profile),
        aiGenerated: false,
      };
    }

    const jsonText = extractJsonObject(content);
    if (!jsonText) {
      if (requireAi) throw new Error("Cursor agent returned no JSON object.");
      return {
        workout: fallbackDayWorkout(candidates, focus, profile),
        aiGenerated: false,
      };
    }

    const parsed = JSON.parse(jsonText) as unknown;
    const result = dayWorkoutSchema.safeParse(parsed);
    if (!result.success) {
      if (requireAi) throw new Error("Cursor agent returned invalid workout JSON.");
      return {
        workout: fallbackDayWorkout(candidates, focus, profile),
        aiGenerated: false,
      };
    }

    return { workout: result.data, aiGenerated: true };
  } catch (err) {
    console.error("Cursor day generation failed:", err);
    if (requireAi) {
      const name = err instanceof Error ? err.name : "";
      if (name === "CursorAgentError" || name.includes("Cursor")) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(
          `Cursor agent failed to start: ${message}. Check CURSOR_API_KEY and quota.`,
        );
      }
      throw err instanceof Error
        ? err
        : new Error("Cursor generation failed. Check your API key and quota.");
    }
    return {
      workout: fallbackDayWorkout(candidates, focus, profile),
      aiGenerated: false,
    };
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
