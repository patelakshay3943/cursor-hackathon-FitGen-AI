import { z } from "zod";
import {
  extractJsonObject,
  isCursorConfigured,
  runCursorPrompt,
} from "./cursor-agent";

const liveCueSchema = z.object({
  alert: z.string().min(8).max(180),
});

const summarySchema = z.object({
  headline: z.string().min(8).max(200),
  strengths: z.array(z.string().min(4).max(200)).min(1).max(5),
  improvements: z.array(z.string().min(4).max(200)).min(1).max(5),
});

export type LiveCoachInput = {
  exerciseName: string;
  ruleCue: string;
  formScore: number;
  phase: string;
  metrics: Record<string, number>;
  formOk: boolean;
};

export type SessionCoachInput = {
  exerciseName: string;
  formScore: number;
  totalReps: number;
  targetSets: number;
  targetReps: number;
  setsCompleted: number;
  elapsedSec: number;
  mistakes: string[];
  fallbackHeadline: string;
  fallbackStrengths: string[];
  fallbackImprovements: string[];
};

/**
 * Rewrite a rule-based form issue into a short Cursor LLM red-alert cue.
 * Detection stays rule-based; the LLM improves clarity/accuracy of the message.
 */
export async function generateLiveCoachAlert(
  input: LiveCoachInput,
): Promise<{ alert: string; aiGenerated: boolean }> {
  const fallback = input.ruleCue;

  if (!isCursorConfigured()) {
    return { alert: fallback, aiGenerated: false };
  }

  const prompt = `You are FitGen AI Coach — a strict, accurate strength coach.

CRITICAL:
- Do NOT edit files or use tools.
- Reply with ONE JSON object only.

Context:
- Selected exercise: ${input.exerciseName}
- Pose tracker rule cue: ${input.ruleCue}
- formOk: ${input.formOk}
- phase: ${input.phase}
- formScore: ${input.formScore}%
- metrics: ${JSON.stringify(input.metrics)}

Task:
Write one short red-alert coaching line the athlete should see NOW.
Be specific to ${input.exerciseName}. Correct wrong movements (e.g. push-up during a press).
Max 22 words. Direct. No emojis. No praise.

JSON shape:
{ "alert": "..." }`;

  const text = await runCursorPrompt(prompt);
  if (!text) return { alert: fallback, aiGenerated: false };

  try {
    const json = extractJsonObject(text);
    if (!json) return { alert: fallback, aiGenerated: false };
    const parsed = liveCueSchema.safeParse(JSON.parse(json));
    if (!parsed.success) return { alert: fallback, aiGenerated: false };
    return { alert: parsed.data.alert.trim(), aiGenerated: true };
  } catch {
    return { alert: fallback, aiGenerated: false };
  }
}

/**
 * End-of-session review via Cursor LLM, with local fallback.
 */
export async function generateSessionCoachSummary(
  input: SessionCoachInput,
): Promise<{
  headline: string;
  strengths: string[];
  improvements: string[];
  aiGenerated: boolean;
}> {
  const fallback = {
    headline: input.fallbackHeadline,
    strengths: input.fallbackStrengths,
    improvements: input.fallbackImprovements,
    aiGenerated: false,
  };

  if (!isCursorConfigured()) return fallback;

  const prompt = `You are FitGen AI Coach reviewing a finished motion-tracking set.

CRITICAL:
- Do NOT edit files or use tools.
- Reply with ONE JSON object only.

Session data:
- Exercise: ${input.exerciseName}
- Form score: ${input.formScore}%
- Total reps: ${input.totalReps} (target ${input.targetSets}×${input.targetReps})
- Sets completed: ${input.setsCompleted}/${input.targetSets}
- Duration seconds: ${input.elapsedSec}
- Rule-based form alerts seen: ${JSON.stringify(input.mistakes)}

Write an accurate coach review:
- headline: one sentence
- strengths: 2–4 concrete positives (NEVER claim perfect/strong form if wrong-move alerts exist)
- improvements: 2–4 concrete fixes (use alerts when relevant)
- If totalReps is 0, do NOT praise form score, volume, or reps — acknowledge they showed up and suggest one gentle next step
- If alerts say the athlete did a different exercise (e.g. push-up during Pullups), that MUST be the top improvement and you must NOT praise form score as strong
- Sets completed 0 with some reps means the first set was incomplete — say that clearly

JSON shape:
{
  "headline": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}`;

  const text = await runCursorPrompt(prompt);
  if (!text) return fallback;

  try {
    const json = extractJsonObject(text);
    if (!json) return fallback;
    const parsed = summarySchema.safeParse(JSON.parse(json));
    if (!parsed.success) return fallback;
    return { ...parsed.data, aiGenerated: true };
  } catch {
    return fallback;
  }
}
