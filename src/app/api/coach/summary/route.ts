import {
  generateSessionCoachSummary,
  type SessionCoachInput,
} from "@/backend/services/cursor-motion-coach.service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SessionCoachInput | null;
  if (!body?.exerciseName) {
    return Response.json({ error: "exerciseName is required" }, { status: 400 });
  }

  const result = await generateSessionCoachSummary({
    exerciseName: String(body.exerciseName),
    formScore: Number(body.formScore) || 0,
    totalReps: Number(body.totalReps) || 0,
    targetSets: Number(body.targetSets) || 3,
    targetReps: Number(body.targetReps) || 10,
    setsCompleted: Number(body.setsCompleted) || 0,
    elapsedSec: Number(body.elapsedSec) || 0,
    mistakes: Array.isArray(body.mistakes) ? body.mistakes.map(String) : [],
    fallbackHeadline: String(body.fallbackHeadline || "Session complete"),
    fallbackStrengths: Array.isArray(body.fallbackStrengths)
      ? body.fallbackStrengths.map(String)
      : ["You finished the session"],
    fallbackImprovements: Array.isArray(body.fallbackImprovements)
      ? body.fallbackImprovements.map(String)
      : ["Keep practicing with full range of motion"],
  });

  return Response.json(result);
}
