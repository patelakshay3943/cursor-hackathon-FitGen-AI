"use client";

import { useEffect, useMemo, useState } from "react";

export type CoachTone = "calibrating" | "good" | "adjust" | "wrong" | "lost";

type CoachPanelProps = {
  cue: string;
  formOk: boolean;
  calibrated: boolean;
  lowConfidence: boolean;
  formScore: number;
  phase: string;
  metrics: Record<string, number>;
  repPulse: number;
  /** Compact strip overlaid on the video */
  variant?: "overlay" | "panel";
  /** Cursor LLM is refining this alert */
  llmLoading?: boolean;
  aiGenerated?: boolean;
};

export function deriveTone(params: {
  calibrated: boolean;
  lowConfidence: boolean;
  formOk: boolean;
  metrics: Record<string, number>;
  cue: string;
}): CoachTone {
  const { calibrated, lowConfidence, formOk, metrics, cue } = params;
  if (!calibrated) return "calibrating";
  if (lowConfidence) return "lost";
  const mismatch =
    metrics.mismatch === 1 ||
    metrics.plank === 1 ||
    /push-up|looks like|switch to|instead/i.test(cue);
  if (mismatch || !formOk) return "wrong";
  if (/lower|bend|deeper|control|return|keep|visible|full range/i.test(cue)) {
    return "adjust";
  }
  return "good";
}

const TONE_META: Record<
  CoachTone,
  { label: string; short: string; ring: string; bg: string; text: string; bar: string }
> = {
  calibrating: {
    label: "AI Coach",
    short: "Getting ready",
    ring: "border-sky-400/60",
    bg: "bg-sky-500/15",
    text: "text-sky-50",
    bar: "bg-sky-400",
  },
  good: {
    label: "AI Coach",
    short: "Looking good",
    ring: "border-emerald-400/70",
    bg: "bg-emerald-500/20",
    text: "text-emerald-50",
    bar: "bg-emerald-400",
  },
  adjust: {
    label: "AI Coach",
    short: "Small fix",
    ring: "border-amber-400/70",
    bg: "bg-amber-500/20",
    text: "text-amber-50",
    bar: "bg-amber-400",
  },
  wrong: {
    label: "AI Coach",
    short: "Wrong move",
    ring: "border-rose-400/80",
    bg: "bg-rose-500/25",
    text: "text-rose-50",
    bar: "bg-rose-400",
  },
  lost: {
    label: "AI Coach",
    short: "Come back",
    ring: "border-orange-400/70",
    bg: "bg-orange-500/20",
    text: "text-orange-50",
    bar: "bg-orange-400",
  },
};

/**
 * Live coach overlay — only red “wrong move” alerts (green/good cues hidden).
 */
export function CoachPanel({
  cue,
  formOk,
  calibrated,
  lowConfidence,
  formScore,
  metrics,
  repPulse: _repPulse,
  llmLoading = false,
  aiGenerated = false,
}: CoachPanelProps) {
  const tone = useMemo(
    () =>
      deriveTone({ calibrated, lowConfidence, formOk, metrics, cue }),
    [calibrated, lowConfidence, formOk, metrics, cue],
  );

  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (tone !== "wrong") {
      setFlash(false);
      return;
    }
    setFlash(true);
    const id = window.setTimeout(() => setFlash(false), 500);
    return () => clearTimeout(id);
  }, [tone, cue]);

  // Only surface hard form / wrong-exercise alerts
  if (tone !== "wrong") return null;

  const meta = TONE_META.wrong;

  return (
    <div
      className={`pointer-events-none absolute inset-x-3 z-10 bottom-[7.5rem] sm:inset-x-4 sm:bottom-4 md:bottom-4 ${
        flash ? "coach-flash-wrong" : ""
      }`}
      aria-live="assertive"
    >
      <div
        className={`coach-overlay rounded-2xl border backdrop-blur-md ${meta.ring} ${meta.bg} ${meta.text} px-3 py-2.5 shadow-lg sm:px-3.5 sm:py-3`}
      >
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span
            className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${meta.bar} coach-dot`}
            aria-hidden
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-90">
            {meta.label}
          </span>
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {meta.short}
          </span>
          {aiGenerated ? (
            <span className="hidden rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline">
              Cursor LLM
            </span>
          ) : null}
          {llmLoading ? (
            <span className="text-[10px] font-medium opacity-80">Refining…</span>
          ) : null}
          {calibrated ? (
            <span className="ml-auto text-[10px] font-medium opacity-80">
              Form {formScore}%
            </span>
          ) : null}
        </div>
        <p
          key={cue}
          className="coach-msg mt-1.5 font-display text-sm font-semibold leading-snug sm:text-lg"
        >
          {cue}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/25">
          <div
            className={`h-full ${meta.bar} transition-all duration-300`}
            style={{ width: `${Math.max(12, formScore)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
