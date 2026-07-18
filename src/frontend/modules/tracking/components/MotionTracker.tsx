"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/Button";
import { apiPost } from "@/shared/services/http";
import { createTrackerForExercise, isPreciseTracker } from "../exercises/registry";
import { usePoseCamera } from "../hooks/usePoseCamera";
import { useExerciseSession } from "../hooks/useExerciseSession";
import { useLlmLiveCoach } from "../hooks/useLlmLiveCoach";
import { TrackingOverlay } from "./TrackingOverlay";
import { CoachPanel, deriveTone } from "./CoachPanel";
import { buildSessionReview } from "../lib/sessionReview";
import {
  buildPostWorkoutAppreciation,
  buildPreWorkoutAffirmation,
  type PostWorkoutAppreciation,
} from "../lib/buildAppreciation";
import { getKeepGoingLine, getMotivationLine } from "../lib/affirmations";
import {
  getProfileFromSession,
  getShowUpCount,
  recordWorkout,
} from "@/shared/lib/sessionPerson";

type MotionTrackerProps = {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  backHref: string;
};

type SummaryState = {
  headline: string;
  strengths: string[];
  improvements: string[];
  aiGenerated: boolean;
  loading: boolean;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MotionTracker({
  exerciseId,
  exerciseName,
  targetSets,
  targetReps,
  backHref,
}: MotionTrackerProps) {
  const [sessionOn, setSessionOn] = useState(false);
  const [whyReady, setWhyReady] = useState(false);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const [appreciation, setAppreciation] = useState<PostWorkoutAppreciation | null>(
    null,
  );

  const tracker = useMemo(
    () => createTrackerForExercise(exerciseId, exerciseName),
    [exerciseId, exerciseName],
  );
  const precise = isPreciseTracker(exerciseId, exerciseName);

  const { stats, processFrame, resetSession, pauseCounting, resumeCounting } =
    useExerciseSession({
      tracker,
      active: sessionOn && !finished,
      targetSets,
      targetReps,
    });

  const { videoRef, ready, error, lowConfidence, landmarks, fps } =
    usePoseCamera(sessionOn && !finished, processFrame);

  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ready && videoRef.current) {
      setVideoEl(videoRef.current);
    }
  }, [ready, videoRef]);

  // Lock body scroll while live tracking on phones only
  useEffect(() => {
    if (finished) return;
    const mq = window.matchMedia("(max-width: 767px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [finished]);

  const isWrong =
    deriveTone({
      calibrated: stats.calibrated,
      lowConfidence,
      formOk: stats.formOk,
      metrics: stats.metrics,
      cue: stats.cue,
    }) === "wrong";

  const llmCoach = useLlmLiveCoach({
    enabled: sessionOn && !finished && ready,
    isWrong,
    exerciseName,
    ruleCue: stats.cue,
    formScore: stats.formScore,
    phase: stats.phase,
    metrics: stats.metrics,
    formOk: stats.formOk,
  });

  const liveEncouragement = useMemo(
    () => getKeepGoingLine(stats.totalReps + stats.setsCompleted),
    [stats.totalReps, stats.setsCompleted],
  );
  const showLiveEncouragement =
    ready && stats.calibrated && stats.formOk && !isWrong && stats.counting;

  useEffect(() => {
    if (!finished) return;

    const profile = getProfileFromSession();
    const showUpCount = getShowUpCount() + 1;
    const appreciationResult = buildPostWorkoutAppreciation(
      profile,
      stats,
      showUpCount,
    );
    setAppreciation(appreciationResult);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }

    const totalReps =
      stats.totalReps || stats.setsCompleted * stats.targetReps + stats.reps;
    recordWorkout({
      exerciseName,
      totalReps,
      formScore: stats.formScore,
      elapsedSec: stats.elapsedSec,
      appreciation: appreciationResult.message,
    });

    const fallback = buildSessionReview(stats, exerciseName);
    setSummary({
      headline: fallback.headline,
      strengths: fallback.strengths,
      improvements: fallback.improvements,
      aiGenerated: false,
      loading: true,
    });

    let cancelled = false;
    void apiPost<{
      headline: string;
      strengths: string[];
      improvements: string[];
      aiGenerated: boolean;
    }>("/api/coach/summary", {
      exerciseName,
      formScore: stats.formScore,
      totalReps: stats.totalReps,
      targetSets: stats.targetSets,
      targetReps: stats.targetReps,
      setsCompleted: stats.setsCompleted,
      elapsedSec: stats.elapsedSec,
      mistakes: stats.mistakes,
      fallbackHeadline: fallback.headline,
      fallbackStrengths: fallback.strengths,
      fallbackImprovements: fallback.improvements,
    })
      .then((res) => {
        if (cancelled) return;
        setSummary({
          headline: res.headline,
          strengths: res.strengths,
          improvements: res.improvements,
          aiGenerated: Boolean(res.aiGenerated),
          loading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSummary((s) => (s ? { ...s, loading: false } : s));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (!whyReady) {
    const pre = buildPreWorkoutAffirmation(getProfileFromSession(), getShowUpCount());

    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-8 fit-fade-up max-md:min-h-[100dvh] max-md:bg-[var(--fit-bg)] md:rounded-[1.5rem] md:border md:border-[var(--fit-border)] md:bg-[var(--fit-surface)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fit-accent)]">
          You are here to become
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-[var(--fit-ink)] sm:text-4xl">
          {pre.becoming}
        </h1>
        <p className="text-base leading-relaxed text-[var(--fit-muted)]">{pre.preLine}</p>
        {pre.focusLine ? (
          <p className="text-sm leading-relaxed text-[var(--fit-ink)]">{pre.focusLine}</p>
        ) : null}
        {pre.motivationLine ? (
          <div className="rounded-2xl border border-[var(--fit-accent)]/25 bg-[var(--fit-accent-soft)] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--fit-accent)]">
              Your why
            </p>
            <p className="mt-1.5 text-sm italic leading-relaxed text-[var(--fit-ink)]">
              &ldquo;{pre.motivationLine}&rdquo;
            </p>
          </div>
        ) : null}
        <p className="rounded-xl bg-[var(--fit-accent-soft)]/60 px-4 py-3 text-sm font-medium leading-relaxed text-[var(--fit-ink)]">
          {pre.encouragementLine}
        </p>
        <p className="text-sm text-[var(--fit-muted)]">
          Workout #{pre.workoutNumber} this session · {exerciseName}
        </p>
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setWhyReady(true);
              setSessionOn(true);
            }}
          >
            I&apos;m ready — let&apos;s go
          </Button>
          <Link href={backHref} className="w-full">
            <Button type="button" variant="secondary" className="w-full">
              Back to plan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (finished) {
    const review = summary ?? {
      ...buildSessionReview(stats, exerciseName),
      aiGenerated: false,
      loading: true,
    };
    const praise =
      appreciation ??
      buildPostWorkoutAppreciation(getProfileFromSession(), stats, getShowUpCount());
    const motivationLine = getMotivationLine(getProfileFromSession());

    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 py-6 fit-fade-up max-md:min-h-[100dvh] max-md:bg-[var(--fit-bg)] md:rounded-[1.5rem] md:border md:border-[var(--fit-border)] md:bg-[var(--fit-surface)] md:p-6">
        <div className="fit-celebrate-card rounded-2xl border border-[var(--fit-accent)]/35 bg-gradient-to-br from-[var(--fit-accent-soft)] to-[var(--fit-surface)] px-5 py-6">
          <p className="fit-fade-up text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fit-accent)]">
            You showed up for yourself
          </p>
          <h1 className="fit-fade-up fit-delay-1 mt-2 font-display text-2xl font-semibold leading-snug text-[var(--fit-ink)] sm:text-3xl">
            {praise.title}
          </h1>
          {praise.milestone ? (
            <p className="fit-fade-up fit-delay-2 mt-3 text-sm font-medium leading-relaxed text-[var(--fit-accent)]">
              {praise.milestone}
            </p>
          ) : null}
          <p className="fit-fade-up fit-delay-2 mt-4 text-base leading-relaxed text-[var(--fit-ink)]">
            {praise.message}
          </p>
          <p className="fit-fade-up fit-delay-3 mt-4 text-sm font-semibold leading-relaxed text-[var(--fit-ink)]">
            {praise.encouragement}
          </p>
          {motivationLine ? (
            <div className="fit-fade-up fit-delay-4 mt-4 rounded-xl border border-[var(--fit-accent)]/20 bg-white/40 px-4 py-3 dark:bg-black/20">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--fit-accent)]">
                Remember your why
              </p>
              <p className="mt-1.5 text-sm italic leading-relaxed text-[var(--fit-ink)]">
                &ldquo;{motivationLine}&rdquo;
              </p>
            </div>
          ) : null}
          <p className="fit-fade-up fit-delay-5 mt-4 text-sm font-medium text-[var(--fit-accent)]">
            {praise.footer}
          </p>
        </div>

        <p className="fit-fade-up fit-delay-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fit-muted)]">
          Session details · {exerciseName}
          {review.loading ? " · generating coach notes…" : ""}
        </p>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[
            [
              "Sets done",
              `${stats.setsCompleted}/${targetSets}${
                stats.setsCompleted < targetSets && stats.totalReps > 0
                  ? ` · ${stats.reps}/${targetReps} in set`
                  : ""
              }`,
            ],
            ["Total reps", String(stats.totalReps)],
            ["Form score", `${stats.formScore}%`],
            ["Duration", formatTime(stats.elapsedSec)],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-2xl bg-[var(--fit-surface)] px-3 py-3 md:bg-[var(--fit-bg)]"
            >
              <dt className="text-xs text-[var(--fit-muted)]">{k}</dt>
              <dd className="mt-1 font-display text-xl font-semibold text-[var(--fit-ink)] break-words">
                {v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50/80 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/30">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            What went well
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--fit-ink)]">
            {review.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-0.5 text-emerald-600 dark:text-emerald-400">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-rose-300/50 bg-rose-50/80 px-4 py-3 dark:border-rose-800/50 dark:bg-rose-950/30">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">
            Your next edge
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--fit-ink)]">
            {review.improvements.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-0.5 text-rose-600 dark:text-rose-400">–</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => {
              setFinished(false);
              setSummary(null);
              setAppreciation(null);
              setWhyReady(false);
              setSessionOn(false);
              resetSession();
            }}
          >
            Train again
          </Button>
          <Link href={backHref} className="w-full sm:w-auto">
            <Button type="button" variant="secondary" className="w-full">
              Back to plan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="track-stage relative flex flex-col bg-black max-md:fixed max-md:inset-0 max-md:z-40 md:space-y-4 md:bg-transparent">
      {/* Desktop header */}
      <div className="hidden flex-wrap items-end justify-between gap-3 md:flex">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fit-accent)]">
            Motion · Cursor LLM Coach
            {precise ? " · Precise detect" : " · Guided detect"}
          </p>
          <h1 className="font-display text-2xl font-semibold text-[var(--fit-ink)] sm:text-3xl">
            {exerciseName}
          </h1>
          <p className="mt-1 text-sm text-[var(--fit-muted)]">
            Target {targetSets} sets × {targetReps} reps · Keep the full body in
            frame
          </p>
        </div>
        <Link href={backHref}>
          <Button type="button" variant="ghost">
            Exit
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="z-20 mx-3 mt-[max(0.75rem,env(safe-area-inset-top))] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-0 md:mt-0">
          {error}
          <p className="mt-2 text-xs text-red-600/80">
            On iPhone: Settings → Safari → Camera → Allow. Use HTTPS or localhost.
          </p>
          <Link href={backHref} className="mt-3 inline-block md:hidden">
            <Button type="button" variant="secondary">
              Back
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1 overflow-hidden bg-black max-md:h-full md:aspect-video md:flex-none md:rounded-[1.5rem] md:border md:border-[var(--fit-border)]">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          playsInline
          muted
          autoPlay
        />
        <TrackingOverlay video={videoEl} landmarks={landmarks} mirrored />

        {/* Mobile top HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/75 via-black/35 to-transparent px-3 pb-8 pt-[max(0.65rem,env(safe-area-inset-top))] md:hidden">
          <div className="pointer-events-auto flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                {precise ? "Precise" : "Guided"} · Live
              </p>
              <h1 className="truncate font-display text-lg font-semibold text-white">
                {exerciseName}
              </h1>
            </div>
            <Link href={backHref}>
              <button
                type="button"
                className="rounded-full bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md"
              >
                Exit
              </button>
            </Link>
          </div>
        </div>

        {!ready && !error ? (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/60 px-6 text-center text-sm text-white">
            Loading camera &amp; BlazePose…
            <br />
            <span className="mt-1 block text-xs text-white/70">
              Allow camera access when prompted
            </span>
          </div>
        ) : null}

        {showLiveEncouragement ? (
          <div className="pointer-events-none absolute inset-x-3 top-[4.75rem] z-[8] flex justify-center md:inset-x-auto md:right-4 md:top-4 md:justify-end">
            <p className="fit-fade-in max-w-[18rem] rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1.5 text-center text-xs font-medium leading-snug text-emerald-50 backdrop-blur-md">
              {liveEncouragement}
            </p>
          </div>
        ) : null}

        {!stats.calibrated && ready ? (
          <div className="absolute inset-x-0 top-16 z-[5] px-4 md:top-0 md:bg-gradient-to-b md:from-black/70 md:to-transparent md:p-4 md:pt-4">
            <p className="text-sm font-medium text-white drop-shadow">
              Hold still — locking onto your pose…
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[var(--fit-accent)] transition-all"
                style={{
                  width: `${Math.round(stats.calibrationProgress * 100)}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        {ready ? (
          <CoachPanel
            variant="overlay"
            cue={isWrong ? llmCoach.displayCue : stats.cue}
            formOk={stats.formOk}
            calibrated={stats.calibrated}
            lowConfidence={lowConfidence}
            formScore={stats.formScore}
            phase={stats.phase}
            metrics={stats.metrics}
            repPulse={stats.repPulse}
            llmLoading={llmCoach.loading}
            aiGenerated={llmCoach.aiGenerated}
          />
        ) : null}

        {/* Mobile bottom HUD: stats + controls */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pt-10 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <div className="mb-3 grid grid-cols-4 gap-2">
            {[
              ["Set", `${Math.min(stats.setsCompleted + 1, targetSets)}/${targetSets}`],
              ["Reps", `${stats.reps}/${targetReps}`],
              ["Form", `${stats.formScore}%`],
              ["Time", formatTime(stats.elapsedSec)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-white/10 px-2 py-2 text-center backdrop-blur-md"
              >
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/65">
                  {label}
                </p>
                <p className="mt-0.5 font-display text-base font-semibold text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="pointer-events-auto flex gap-2">
            {stats.counting ? (
              <button
                type="button"
                onClick={pauseCounting}
                className="flex-1 rounded-full bg-white/15 py-3 text-sm font-semibold text-white backdrop-blur-md"
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeCounting}
                disabled={!stats.calibrated}
                className="flex-1 rounded-full bg-white/15 py-3 text-sm font-semibold text-white backdrop-blur-md disabled:opacity-40"
              >
                Resume
              </button>
            )}
            <button
              type="button"
              onClick={() => resetSession()}
              className="rounded-full bg-white/15 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setFinished(true);
                setSessionOn(false);
              }}
              className="rounded-full bg-[var(--fit-accent)] px-4 py-3 text-sm font-semibold text-white"
            >
              End
            </button>
          </div>
        </div>
      </div>

      {/* Desktop stats + controls */}
      <div className="hidden grid-cols-2 gap-3 sm:grid-cols-5 md:grid">
        {[
          ["Set", `${Math.min(stats.setsCompleted + 1, targetSets)}/${targetSets}`],
          ["Reps", `${stats.reps}/${targetReps}`],
          ["Form", `${stats.formScore}%`],
          ["Time", formatTime(stats.elapsedSec)],
          ["FPS", String(fps || "—")],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-surface)] px-3 py-3 text-center"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fit-muted)]">
              {label}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-[var(--fit-ink)]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="hidden flex-wrap gap-3 md:flex">
        {stats.counting ? (
          <Button type="button" variant="secondary" onClick={pauseCounting}>
            Pause counting
          </Button>
        ) : (
          <Button
            type="button"
            onClick={resumeCounting}
            disabled={!stats.calibrated}
          >
            Resume counting
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => resetSession()}>
          Reset
        </Button>
        <Button
          type="button"
          onClick={() => {
            setFinished(true);
            setSessionOn(false);
          }}
        >
          End session
        </Button>
      </div>
    </div>
  );
}
