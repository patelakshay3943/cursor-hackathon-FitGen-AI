import {
  isElevenLabsConfigured,
  synthesizeCoachSpeech,
} from "@/backend/services/elevenlabs-tts.service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    text?: string;
  } | null;

  const text = String(body?.text ?? "").trim();
  if (text.length < 4) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  if (!isElevenLabsConfigured()) {
    return Response.json(
      { error: "ElevenLabs TTS is not configured" },
      { status: 503 },
    );
  }

  try {
    const audio = await synthesizeCoachSpeech(text);
    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to synthesize speech";
    return Response.json({ error: message }, { status: 502 });
  }
}
