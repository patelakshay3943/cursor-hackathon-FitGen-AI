import {
  generateLiveCoachAlert,
  type LiveCoachInput,
} from "@/backend/services/cursor-motion-coach.service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LiveCoachInput | null;
  if (!body?.exerciseName || !body?.ruleCue) {
    return Response.json(
      { error: "exerciseName and ruleCue are required" },
      { status: 400 },
    );
  }

  const result = await generateLiveCoachAlert({
    exerciseName: String(body.exerciseName),
    ruleCue: String(body.ruleCue),
    formScore: Number(body.formScore) || 0,
    phase: String(body.phase || "idle"),
    metrics: body.metrics && typeof body.metrics === "object" ? body.metrics : {},
    formOk: Boolean(body.formOk),
  });

  return Response.json(result);
}
