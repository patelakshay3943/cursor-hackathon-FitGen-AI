/** Default: Rachel — clear, coach-friendly. Override with ELEVENLABS_VOICE_ID. */
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
/** Flash model — low latency for live workout cues */
const DEFAULT_MODEL_ID = "eleven_flash_v2_5";

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

/**
 * Synthesize short coach alert speech via ElevenLabs TTS.
 * Returns MPEG audio bytes.
 */
export async function synthesizeCoachSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const voiceId =
    process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
  const modelId =
    process.env.ELEVENLABS_MODEL_ID?.trim() || DEFAULT_MODEL_ID;

  const clipped = text.trim().slice(0, 220);
  if (clipped.length < 4) {
    throw new Error("Text too short for TTS");
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: clipped,
        model_id: modelId,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  return res.arrayBuffer();
}
