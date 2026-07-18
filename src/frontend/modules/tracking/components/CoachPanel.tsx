"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCoachVoice } from "../hooks/useCoachVoice";

export type CoachTone = "calibrating" | "good" | "adjust" | "wrong" | "lost";

type CoachPanelProps = {
  cue: string;
  suggestion?: string;
  issueBodyParts?: string[];
  wholeExerciseWrong?: boolean;
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

/** Show red alert quickly */
const SHOW_DEBOUNCE_MS = 120;
/** Keep banner up at least this long once shown */
const MIN_HOLD_MS = 2200;
/** After form recovers, wait this long before hiding */
const HIDE_DEBOUNCE_MS = 900;

export function deriveTone(params: {
  calibrated: boolean;
  lowConfidence: boolean;
  formOk: boolean;
  metrics: Record<string, number>;
  cue: string;
  issueLandmarks?: number[];
}): CoachTone {
  const { calibrated, lowConfidence, formOk, metrics, cue, issueLandmarks } =
    params;
  if (!calibrated) return "calibrating";
  if (lowConfidence) return "lost";
  const mismatch =
    metrics.mismatch === 1 ||
    metrics.plank === 1 ||
    /push-up|looks like|switch to|instead|hang and pull/i.test(cue);
  if (mismatch) return "wrong";
  if (!formOk || (issueLandmarks?.length ?? 0) > 0) return "adjust";
  if (/lower|bend|deeper|control|return|keep|visible|full range/i.test(cue)) {
    return "adjust";
  }
  return "good";
}

const TONE_META = {
  wrong: {
    label: "Wrong exercise",
    short: "Fix pose",
    ring: "border-rose-400/90",
    bg: "bg-rose-600/30",
    text: "text-rose-50",
    bar: "bg-rose-400",
    glow: "coach-glow-wrong",
  },
  adjust: {
    label: "Form alert",
    short: "Fix area",
    ring: "border-rose-400/80",
    bg: "bg-rose-500/25",
    text: "text-rose-50",
    bar: "bg-rose-400",
    glow: "coach-glow-wrong",
  },
} as const;

/**
 * Live red coach overlay — body-part chips, instant suggestion, LLM refine ≤5s.
 */
export function CoachPanel({
  cue,
  suggestion = "",
  issueBodyParts = [],
  wholeExerciseWrong = false,
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
      deriveTone({
        calibrated,
        lowConfidence,
        formOk,
        metrics,
        cue,
        issueLandmarks: issueBodyParts.length ? [0] : [],
      }),
    [calibrated, lowConfidence, formOk, metrics, cue, issueBodyParts.length],
  );

  const alertTone =
    rawTone === "wrong" || rawTone === "adjust" ? rawTone : null;

  const [visible, setVisible] = useState(false);
  const [stableCue, setStableCue] = useState(cue);
  const [stableSuggestion, setStableSuggestion] = useState(suggestion);
  const [flash, setFlash] = useState(false);

  const shownAtRef = useRef(0);
  const wrongSinceRef = useRef<number | null>(null);
  const okSinceRef = useRef<number | null>(null);
  const lastFlashedKeyRef = useRef("");

  useEffect(() => {
    const now = performance.now();
    const shouldShow =
      alertTone !== null &&
      !lowConfidence &&
      (calibrated || wholeExerciseWrong || metrics.mismatch === 1) &&
      (wholeExerciseWrong || !formOk || issueBodyParts.length > 0);

    if (shouldShow) {
      okSinceRef.current = null;
      if (wrongSinceRef.current == null) wrongSinceRef.current = now;

      if (cue.trim()) setStableCue(cue);
      if (suggestion.trim()) setStableSuggestion(suggestion);

      const flashKey = `${cue}::${issueBodyParts.join(",")}`;
      if (!visible && now - wrongSinceRef.current >= SHOW_DEBOUNCE_MS) {
        setVisible(true);
        shownAtRef.current = now;
        if (lastFlashedKeyRef.current !== flashKey) {
          lastFlashedKeyRef.current = flashKey;
          setFlash(true);
          window.setTimeout(() => setFlash(false), 500);
        }
      }
      return;
    }

    wrongSinceRef.current = null;
    if (!visible) return;

    if (okSinceRef.current == null) okSinceRef.current = now;
    const heldLongEnough = now - shownAtRef.current >= MIN_HOLD_MS;
    const recoveredLongEnough = now - okSinceRef.current >= HIDE_DEBOUNCE_MS;

    if (heldLongEnough && recoveredLongEnough) {
      setVisible(false);
      lastFlashedKeyRef.current = "";
    }
  }, [
    alertTone,
    cue,
    suggestion,
    visible,
    calibrated,
    lowConfidence,
    formOk,
    wholeExerciseWrong,
    issueBodyParts,
    metrics,
  ]);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      const now = performance.now();
      const shouldShow =
        alertTone !== null &&
        !lowConfidence &&
        (calibrated || wholeExerciseWrong || metrics.mismatch === 1) &&
        (wholeExerciseWrong || !formOk || issueBodyParts.length > 0);
      if (shouldShow) return;
      if (okSinceRef.current == null) okSinceRef.current = now;
      const heldLongEnough = now - shownAtRef.current >= MIN_HOLD_MS;
      const recoveredLongEnough =
        now - (okSinceRef.current ?? now) >= HIDE_DEBOUNCE_MS;
      if (heldLongEnough && recoveredLongEnough) {
        setVisible(false);
        lastFlashedKeyRef.current = "";
        wrongSinceRef.current = null;
      }
    }, 150);
    return () => clearInterval(id);
  }, [
    visible,
    alertTone,
    calibrated,
    lowConfidence,
    formOk,
    wholeExerciseWrong,
    issueBodyParts,
    metrics,
  ]);

  // Voice alert when the red banner is up (ElevenLabs + browser fallback)
  useCoachVoice(visible, stableCue);

  if (!visible || !alertTone) return null;

  const meta = TONE_META[alertTone];
  const displayParts = wholeExerciseWrong ? ["Full body"] : issueBodyParts;

  return (
    <div
      className={`pointer-events-none absolute inset-x-2 z-10 bottom-[10.5rem] max-[380px]:bottom-[9.75rem] sm:inset-x-4 sm:bottom-[8.5rem] md:bottom-4 ${
        flash ? "coach-flash-wrong" : ""
      }`}
      aria-live="assertive"
      role="alert"
    >
      <div
        className={`coach-overlay rounded-xl border backdrop-blur-md sm:rounded-2xl ${meta.ring} ${meta.bg} ${meta.text} ${meta.glow} px-2.5 py-2 shadow-lg sm:px-3.5 sm:py-3`}
      >
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <span
            className={`coach-dot inline-flex h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5 ${meta.bar}`}
            aria-hidden
          />
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] opacity-95 sm:text-[10px] sm:tracking-[0.2em]">
            {meta.label}
          </span>
          <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:px-2 sm:text-[10px]">
            {meta.short}
          </span>
          {aiGenerated ? (
            <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:px-2 sm:text-[10px]">
              AI tip
            </span>
          ) : null}
          {llmLoading ? (
            <span className="text-[9px] font-medium opacity-85 sm:text-[10px]">
              Refining…
            </span>
          ) : null}
          {calibrated ? (
            <span className="ml-auto text-[9px] font-medium opacity-80 sm:text-[10px]">
              Form {formScore}%
            </span>
          ) : null}
        </div>

        {displayParts.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {displayParts.map((part) => (
              <span
                key={part}
                className="coach-part-chip rounded-full border border-rose-200/40 bg-rose-500/35 px-2 py-0.5 text-[10px] font-semibold text-rose-50 sm:text-[11px]"
              >
                {part}
              </span>
            ))}
          </div>
        ) : null}

        <p className="coach-msg mt-1.5 font-display text-[13px] font-semibold leading-snug sm:text-base md:text-lg">
          {stableCue}
        </p>

        {stableSuggestion && stableSuggestion !== stableCue ? (
          <p className="coach-suggestion mt-1 text-[11px] leading-snug opacity-90 sm:text-xs sm:leading-relaxed">
            {stableSuggestion}
          </p>
        ) : null}

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
