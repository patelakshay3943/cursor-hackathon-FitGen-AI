import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadCursorSdk } from "./cursor-sdk-bootstrap";

export function getCursorApiKey(): string | null {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key || key === "cursor_..." || key.length < 20) return null;
  return key;
}

export function getCursorModelId(): string {
  return process.env.CURSOR_MODEL?.trim() || "composer-2.5";
}

export function isCursorConfigured(): boolean {
  return Boolean(getCursorApiKey());
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

/**
 * One-shot Cursor agent prompt in an empty temp cwd (no repo edits).
 * Returns assistant text or null on failure.
 */
export async function runCursorPrompt(prompt: string): Promise<string | null> {
  const apiKey = getCursorApiKey();
  if (!apiKey) return null;

  let tempDir: string | null = null;
  try {
    const { Agent } = await loadCursorSdk();
    tempDir = await mkdtemp(join(tmpdir(), "fitgen-cursor-"));
    await writeFile(
      join(tempDir, "README.txt"),
      "FitGen ephemeral workspace. Do not edit files. Reply with JSON only.\n",
      "utf8",
    );

    const run = await Agent.prompt(prompt, {
      apiKey,
      model: { id: getCursorModelId() },
      local: { cwd: tempDir },
    });

    if (run.status === "error") {
      console.error("Cursor agent error:", run.error?.message);
      return null;
    }
    return run.result?.trim() || null;
  } catch (err) {
    console.error("Cursor prompt failed:", err);
    return null;
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
