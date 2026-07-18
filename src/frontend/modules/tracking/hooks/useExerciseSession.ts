"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Landmark } from "../lib/pose/landmarks";
import type { ExerciseTracker, TrackerResult } from "../exercises/types";
import type { PoseFrameMeta } from "./usePoseCamera";

const FRAME_CALIBRATION_MS = 1800;
const SETUP_HOLD_MS = 2200;
const TEMPO_MIN_DOWN_MS = 1500; // ~2s down cue if faster
const DEFAULT_REST_SEC = 45;

export type SetupPhase = "framing" | "pose" | "ready" | "done";

export type SessionStats = {
  reps: number;
  setsCompleted: number;
  targetSets: number;
  targetReps: number;
  elapsedSec: number;
  formScore: number;
  mistakes: string[];
  cue: string;
  phase: string;
  metrics: Record<string, number>;
  calibrated: boolean;
  calibrationProgress: number;
  counting: boolean;
  formOk: boolean;
  repPulse: number;
  totalReps: number;
  /** Setup coach before first rep */
  setupPhase: SetupPhase;
  setupTip: string;
  setupPose: string;
  /** Rest between sets */
  resting: boolean;
  restSecLeft: number;
  /** Tempo coaching */
  tempoCue: string | null;
};

export function useExerciseSession(params: {
  tracker: ExerciseTracker | null;
  active: boolean;
  targetSets: number;
  targetReps: number;
  restSec?: number;
  setupTip?: string;
  setupPose?: string;
}) {
  const {
    tracker,
    active,
    targetSets,
    targetReps,
    restSec = DEFAULT_REST_SEC,
    setupTip = "Step back · full body visible",
    setupPose = "Take your starting pose and hold still",
  } = params;

  const [reps, setReps] = useState(0);
  const [setsCompleted, setSetsCompleted] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [formHits, setFormHits] = useState(0);
  const [formTotal, setFormTotal] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<TrackerResult | null>(null);
  const [calibrated, setCalibrated] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [counting, setCounting] = useState(false);
  const [repPulse, setRepPulse] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [setupPhase, setSetupPhase] = useState<SetupPhase>("framing");
  const [resting, setResting] = useState(false);
  const [restSecLeft, setRestSecLeft] = useState(0);
  const [tempoCue, setTempoCue] = useState<string | null>(null);

  const lastFrameRef = useRef<number>(performance.now());
  const frameMsRef = useRef(0);
  const poseHoldMsRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const calibratedRef = useRef(false);
  const countingRef = useRef(false);
  const restingRef = useRef(false);
  const setupPhaseRef = useRef<SetupPhase>("framing");
  const lastUiCueRef = useRef<string>("");
  const lastProgressPublishRef = useRef(0);
  const formHitsRef = useRef(0);
  const formTotalRef = useRef(0);
  const lastFormPublishRef = useRef(0);
  const downPhaseMsRef = useRef(0);
  const wasInDownRef = useRef(false);
  const restUntilRef = useRef(0);
  const repsRef = useRef(0);
  const setsCompletedRef = useRef(0);

  calibratedRef.current = calibrated;
  countingRef.current = counting;
  restingRef.current = resting;
  setupPhaseRef.current = setupPhase;

  const trackerRef = useRef(tracker);
  trackerRef.current = tracker;
  const targetRepsRef = useRef(targetReps);
  targetRepsRef.current = targetReps;
  const targetSetsRef = useRef(targetSets);
  targetSetsRef.current = targetSets;
  const restSecRef = useRef(restSec);
  restSecRef.current = restSec;

  useEffect(() => {
    if (!active) {
      setCounting(false);
      countingRef.current = false;
      return;
    }
    startedAtRef.current = performance.now();
    const id = window.setInterval(() => {
      if (startedAtRef.current) {
        setElapsedSec(
          Math.floor((performance.now() - startedAtRef.current) / 1000),
        );
      }
      if (restingRef.current) {
        const left = Math.max(
          0,
          Math.ceil((restUntilRef.current - performance.now()) / 1000),
        );
        setRestSecLeft(left);
        if (left <= 0) {
          restingRef.current = false;
          setResting(false);
          countingRef.current = true;
          setCounting(true);
          trackerRef.current?.reset();
          setTempoCue("Rest done — ready for next set");
        }
      }
    }, 250);
    return () => clearInterval(id);
  }, [active]);

  const beginRest = useCallback(() => {
    const sec = restSecRef.current;
    restUntilRef.current = performance.now() + sec * 1000;
    restingRef.current = true;
    countingRef.current = false;
    setResting(true);
    setCounting(false);
    setRestSecLeft(sec);
    setTempoCue(null);
  }, []);

  const skipRest = useCallback(() => {
    restUntilRef.current = 0;
    restingRef.current = false;
    setResting(false);
    setRestSecLeft(0);
    if (calibratedRef.current) {
      countingRef.current = true;
      setCounting(true);
      trackerRef.current?.reset();
    }
  }, []);

  const processFrame = useCallback(
    (landmarks: Landmark[] | null, meta: PoseFrameMeta) => {
      if (!active) return;
      const currentTracker = trackerRef.current;
      if (!currentTracker) return;

      const now = performance.now();
      const dt = Math.min(100, now - lastFrameRef.current);
      lastFrameRef.current = now;

      // Resting — don't count
      if (restingRef.current) return;

      if (meta.lowConfidence || !landmarks) {
        frameMsRef.current = Math.max(0, frameMsRef.current - dt);
        poseHoldMsRef.current = 0;
        const progress = Math.min(1, frameMsRef.current / FRAME_CALIBRATION_MS);
        if (now - lastProgressPublishRef.current > 100) {
          lastProgressPublishRef.current = now;
          setCalibrationProgress(progress * 0.5);
        }
        if (!calibratedRef.current) {
          setupPhaseRef.current = "framing";
          setSetupPhase("framing");
        } else {
          const cue = "Move back into frame";
          if (lastUiCueRef.current !== cue) {
            lastUiCueRef.current = cue;
            setLastResult({
              phase: "idle",
              repCompleted: false,
              cues: [cue],
              formOk: false,
              metrics: {},
              ready: false,
            });
          }
        }
        return;
      }

      // ——— Setup coach (before counting) ———
      if (!calibratedRef.current) {
        frameMsRef.current += dt;
        const frameProgress = Math.min(
          1,
          frameMsRef.current / FRAME_CALIBRATION_MS,
        );

        if (frameProgress < 1) {
          setupPhaseRef.current = "framing";
          setSetupPhase("framing");
          setCalibrationProgress(frameProgress * 0.45);
          if (now - lastProgressPublishRef.current > 80) {
            lastProgressPublishRef.current = now;
            setLastResult({
              phase: "idle",
              repCompleted: false,
              cues: ["Setup 1/2 — get fully in frame"],
              formOk: true,
              metrics: {},
              ready: false,
            });
          }
          return;
        }

        // Framing OK — require starting pose hold (tracker ready + formOk)
        const peek = currentTracker.update(landmarks, dt);
        const poseOk = peek.ready && peek.formOk && peek.metrics.mismatch !== 1;

        if (poseOk) {
          poseHoldMsRef.current += dt;
          setupPhaseRef.current = "pose";
          setSetupPhase("pose");
          const holdP = Math.min(1, poseHoldMsRef.current / SETUP_HOLD_MS);
          setCalibrationProgress(0.45 + holdP * 0.55);

          if (poseHoldMsRef.current >= SETUP_HOLD_MS) {
            calibratedRef.current = true;
            countingRef.current = true;
            setupPhaseRef.current = "done";
            setSetupPhase("done");
            setCalibrated(true);
            setCounting(true);
            setCalibrationProgress(1);
            currentTracker.reset();
            setTempoCue("Tempo tip: lower for ~2 seconds each rep");
            return;
          }

          if (now - lastProgressPublishRef.current > 80) {
            lastProgressPublishRef.current = now;
            setLastResult({
              phase: "idle",
              repCompleted: false,
              cues: ["Setup 2/2 — hold your start pose…"],
              formOk: true,
              metrics: peek.metrics,
              ready: false,
            });
          }
        } else {
          poseHoldMsRef.current = Math.max(0, poseHoldMsRef.current - dt * 2);
          setupPhaseRef.current = "pose";
          setSetupPhase("pose");
          setCalibrationProgress(0.45);
          if (now - lastProgressPublishRef.current > 100) {
            lastProgressPublishRef.current = now;
            setLastResult({
              phase: "idle",
              repCompleted: false,
              cues: [peek.cues[0] || "Match the start pose, then hold"],
              formOk: false,
              metrics: peek.metrics,
              ready: false,
            });
          }
        }
        return;
      }

      if (!countingRef.current) return;

      const result = currentTracker.update(landmarks, dt);

      // Tempo: track time spent in down phase
      const inDown = result.phase === "down";
      if (inDown) {
        downPhaseMsRef.current += dt;
        wasInDownRef.current = true;
      } else if (wasInDownRef.current) {
        const downMs = downPhaseMsRef.current;
        wasInDownRef.current = false;
        downPhaseMsRef.current = 0;
        if (downMs > 80 && downMs < TEMPO_MIN_DOWN_MS && result.phase === "up") {
          const tip = "Slow the lowering — aim for about 2 seconds down";
          setTempoCue(tip);
          window.setTimeout(() => {
            setTempoCue((c) => (c === tip ? null : c));
          }, 4000);
          setMistakes((prev) =>
            prev.includes(tip) ? prev : [...prev, tip].slice(-8),
          );
        }
      }

      const cue = result.cues[0] ?? "";
      if (cue !== lastUiCueRef.current || result.repCompleted) {
        lastUiCueRef.current = cue;
        setLastResult(result);
      } else if (now - lastProgressPublishRef.current > 120) {
        lastProgressPublishRef.current = now;
        setLastResult(result);
      }

      const isMismatch =
        result.metrics.mismatch === 1 || result.metrics.plank === 1;
      if (isMismatch) {
        formTotalRef.current += 4;
      } else {
        formHitsRef.current += result.formOk ? 1 : 0;
        formTotalRef.current += 1;
      }
      if (
        now - lastFormPublishRef.current > 250 ||
        result.repCompleted ||
        isMismatch
      ) {
        lastFormPublishRef.current = now;
        setFormHits(formHitsRef.current);
        setFormTotal(formTotalRef.current);
      }

      for (const c of result.cues) {
        if (c && !result.formOk) {
          setMistakes((prev) =>
            prev.includes(c) ? prev : [...prev, c].slice(-8),
          );
        }
      }

      const canCount =
        result.repCompleted &&
        result.ready &&
        result.formOk &&
        result.metrics.mismatch !== 1 &&
        result.metrics.plank !== 1;

      if (canCount) {
        setRepPulse((n) => n + 1);
        setTotalReps((n) => n + 1);
        repsRef.current += 1;
        if (repsRef.current >= targetRepsRef.current) {
          repsRef.current = 0;
          setReps(0);
          const nextSets = Math.min(
            targetSetsRef.current,
            setsCompletedRef.current + 1,
          );
          setsCompletedRef.current = nextSets;
          setSetsCompleted(nextSets);
          currentTracker.reset();
          if (nextSets < targetSetsRef.current) {
            beginRest();
          }
        } else {
          setReps(repsRef.current);
        }
      }
    },
    [active, beginRest],
  );

  const formScore = useMemo(() => {
    if (formTotal === 0) return 100;
    return Math.round((formHits / formTotal) * 100);
  }, [formHits, formTotal]);

  const resetSession = useCallback(() => {
    trackerRef.current?.reset();
    setReps(0);
    setSetsCompleted(0);
    repsRef.current = 0;
    setsCompletedRef.current = 0;
    setElapsedSec(0);
    setFormHits(0);
    setFormTotal(0);
    formHitsRef.current = 0;
    formTotalRef.current = 0;
    setMistakes([]);
    setLastResult(null);
    setCalibrated(false);
    setCalibrationProgress(0);
    setCounting(false);
    calibratedRef.current = false;
    countingRef.current = false;
    frameMsRef.current = 0;
    poseHoldMsRef.current = 0;
    lastUiCueRef.current = "";
    setRepPulse(0);
    setTotalReps(0);
    setSetupPhase("framing");
    setupPhaseRef.current = "framing";
    setResting(false);
    restingRef.current = false;
    setRestSecLeft(0);
    setTempoCue(null);
    downPhaseMsRef.current = 0;
    wasInDownRef.current = false;
    startedAtRef.current = performance.now();
  }, []);

  const pauseCounting = useCallback(() => {
    countingRef.current = false;
    setCounting(false);
  }, []);

  const resumeCounting = useCallback(() => {
    if (calibratedRef.current && !restingRef.current) {
      countingRef.current = true;
      setCounting(true);
    }
  }, []);

  const stats: SessionStats = {
    reps,
    setsCompleted,
    targetSets,
    targetReps,
    elapsedSec,
    formScore,
    mistakes,
    cue:
      resting
        ? `Rest ${restSecLeft}s — shake out, then next set`
        : (lastResult?.cues[0] ??
          (calibrated
            ? "Looking good — keep going"
            : setupPhase === "framing"
              ? "Setup: get fully in frame"
              : "Setup: hold your start pose")),
    phase: lastResult?.phase ?? "idle",
    metrics: lastResult?.metrics ?? {},
    calibrated,
    calibrationProgress,
    counting,
    formOk: lastResult?.formOk ?? true,
    repPulse,
    totalReps,
    setupPhase,
    setupTip,
    setupPose,
    resting,
    restSecLeft,
    tempoCue,
  };

  return {
    stats,
    processFrame,
    resetSession,
    pauseCounting,
    resumeCounting,
    skipRest,
    lastResult,
  };
}
