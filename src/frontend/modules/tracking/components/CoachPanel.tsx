"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCoachVoice } from "../hooks/useCoachVoice";

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

/** Must stay wrong this long before the banner appears */
const SHOW_DEBOUNCE_MS = 280;
/** Keep banner up at least this long once shown */
const MIN_HOLD_MS = 2800;
/** After form recovers, wait this long before hiding */
const HIDE_DEBOUNCE_MS = 1100;

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
    /push-up|looks like|switch to|instead|hang and pull/i.test(cue);
  if (mismatch || !formOk) return "wrong";
  if (/lower|bend|deeper|control|return|keep|visible|full range/i.test(cue)) {
    return "adjust";
  }
  return "good";
}

const TONE_META = {
  wrong: {
    label: "AI Coach",
    short: "Wrong move",
    ring: "border-rose-400/80",
    bg: "bg-rose-500/25",
    text: "text-rose-50",
    bar: "bg-rose-400",
  },
} as const;

/**
 * Live coach overlay — only red alerts, stabilized against frame flicker.
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
  const rawTone = useMemo(
    () =>
      deriveTone({ calibrated, lowConfidence, formOk, metrics, cue }),
    [calibrated, lowConfidence, formOk, metrics, cue],
  );

  const [visible, setVisible] = useState(false);
  const [stableCue, setStableCue] = useState(cue);
  const [flash, setFlash] = useState(false);

  const shownAtRef = useRef(0);
  const wrongSinceRef = useRef<number | null>(null);
  const okSinceRef = useRef<number | null>(null);
  const lastFlashedCueRef = useRef("");

  // Stabilize show/hide so intermittent formOk can't blink the banner
  useEffect(() => {
    const now = performance.now();
    const isWrong = rawTone === "wrong";

    if (isWrong) {
      okSinceRef.current = null;
      if (wrongSinceRef.current == null) wrongSinceRef.current = now;

      // Update cue text only while wrong (don't thrash on empty)
      if (cue.trim()) {
        setStableCue(cue);
      }

      if (!visible && now - wrongSinceRef.current >= SHOW_DEBOUNCE_MS) {
        setVisible(true);
        shownAtRef.current = now;
        if (lastFlashedCueRef.current !== cue) {
          lastFlashedCueRef.current = cue;
          setFlash(true);
          window.setTimeout(() => setFlash(false), 450);
        }
      }
      return;
    }

    // Recovering / good / lost — schedule hide with hold + debounce
    wrongSinceRef.current = null;
    if (!visible) return;

    if (okSinceRef.current == null) okSinceRef.current = now;
    const heldLongEnough = now - shownAtRef.current >= MIN_HOLD_MS;
    const recoveredLongEnough =
      now - okSinceRef.current >= HIDE_DEBOUNCE_MS;

    if (heldLongEnough && recoveredLongEnough) {
      setVisible(false);
      lastFlashedCueRef.current = "";
    }
  }, [rawTone, cue, visible]);

  // Tick while visible so hide debounce can fire without waiting for prop churn
  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      const now = performance.now();
      if (rawTone === "wrong") return;
      if (okSinceRef.current == null) okSinceRef.current = now;
      const heldLongEnough = now - shownAtRef.current >= MIN_HOLD_MS;
      const recoveredLongEnough =
        now - (okSinceRef.current ?? now) >= HIDE_DEBOUNCE_MS;
      if (heldLongEnough && recoveredLongEnough) {
        setVisible(false);
        lastFlashedCueRef.current = "";
        wrongSinceRef.current = null;
      }
    }, 200);
    return () => clearInterval(id);
  }, [visible, rawTone]);

  // Voice alert when the red banner is up (ElevenLabs + browser fallback)
  useCoachVoice(visible, stableCue);

  if (!visible) return null;

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
            className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${meta.bar}`}
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
        <p className="coach-msg mt-1.5 font-display text-sm font-semibold leading-snug sm:text-lg">
          {stableCue}
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
