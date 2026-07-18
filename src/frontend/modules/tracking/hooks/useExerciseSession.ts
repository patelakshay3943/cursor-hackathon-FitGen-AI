"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Landmark } from "../lib/pose/landmarks";
import type { ExerciseTracker, TrackerResult } from "../exercises/types";
import type { PoseFrameMeta } from "./usePoseCamera";
import {
  bodyPartLabels,
  FULL_BODY_SKELETON,
  isWholeExerciseWrong,
} from "../lib/pose/formHighlights";
import {
  classifyPose,
  isPoseCompatible,
  mismatchCue,
  resolveExpectedFamily,
} from "../exercises/movementFamily";

const CALIBRATION_MS = 2000;
const EMPTY_LANDMARKS: readonly number[] = [];
const EMPTY_METRICS: Record<string, number> = {};
const EMPTY_BODY_PARTS: readonly string[] = [];

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
  /** Landmark indices to highlight when form is wrong */
  issueLandmarks: number[];
  /** Human-readable regions for coach alerts */
  issueBodyParts: string[];
  /** Wrong exercise — highlight full skeleton */
  wholeExerciseWrong: boolean;
  /** Increments on each completed rep — used to trigger coach flash */
  repPulse: number;
  /** Total reps completed across the whole session */
  totalReps: number;
};

export function useExerciseSession(params: {
  tracker: ExerciseTracker | null;
  active: boolean;
  targetSets: number;
  targetReps: number;
  exerciseId?: string;
  exerciseName?: string;
}) {
  const { tracker, active, targetSets, targetReps, exerciseId = "", exerciseName = "" } =
    params;

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

  const lastFrameRef = useRef<number>(performance.now());
  const goodMsRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const calibratedRef = useRef(false);
  const countingRef = useRef(false);
  const lastUiCueRef = useRef<string>("");
  const lastProgressPublishRef = useRef(0);
  const formHitsRef = useRef(0);
  const formTotalRef = useRef(0);
  const lastFormPublishRef = useRef(0);

  // Keep refs in sync for the rAF callback without re-binding it.
  calibratedRef.current = calibrated;
  countingRef.current = counting;

  const trackerRef = useRef(tracker);
  trackerRef.current = tracker;
  const targetRepsRef = useRef(targetReps);
  targetRepsRef.current = targetReps;
  const targetSetsRef = useRef(targetSets);
  targetSetsRef.current = targetSets;
  const expectedFamilyRef = useRef(
    resolveExpectedFamily(exerciseId, exerciseName),
  );
  expectedFamilyRef.current = resolveExpectedFamily(exerciseId, exerciseName);

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
    }, 500);
    return () => clearInterval(id);
  }, [active]);

  const processFrame = useCallback(
    (landmarks: Landmark[] | null, meta: PoseFrameMeta) => {
      if (!active) return;
      const currentTracker = trackerRef.current;
      if (!currentTracker) return;

      const now = performance.now();
      const dt = Math.min(100, now - lastFrameRef.current);
      lastFrameRef.current = now;

      if (meta.lowConfidence || !landmarks) {
        goodMsRef.current = Math.max(0, goodMsRef.current - dt);
        const progress = Math.min(1, goodMsRef.current / CALIBRATION_MS);
        if (now - lastProgressPublishRef.current > 100) {
          lastProgressPublishRef.current = now;
          setCalibrationProgress(progress);
        }
        if (calibratedRef.current) {
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

      if (!calibratedRef.current) {
        goodMsRef.current += dt;
        const progress = Math.min(1, goodMsRef.current / CALIBRATION_MS);
        if (now - lastProgressPublishRef.current > 80) {
          lastProgressPublishRef.current = now;
          setCalibrationProgress(progress);
        }

        // Early wrong-exercise preview while locking pose (~0.5s in)
        if (progress >= 0.25) {
          const classified = classifyPose(landmarks);
          const expected = expectedFamilyRef.current;
          if (
            classified &&
            expected !== "generic" &&
            !isPoseCompatible(expected, classified)
          ) {
            const cue = mismatchCue(
              expected,
              classified.family,
              exerciseName || "this exercise",
            );
            setLastResult({
              phase: "idle",
              repCompleted: false,
              cues: [cue],
              formOk: false,
              issueLandmarks: FULL_BODY_SKELETON,
              metrics: {
                mismatch: 1,
                plank: classified.isPlank ? 1 : 0,
              },
              ready: true,
            });
          }
        }

        if (progress >= 1) {
          calibratedRef.current = true;
          countingRef.current = true;
          setCalibrated(true);
          setCounting(true);
          setCalibrationProgress(1);
          currentTracker.reset();
        }
        return;
      }

      if (!countingRef.current) return;

      const result = currentTracker.update(landmarks, dt);
      const cue = result.cues[0] ?? "";
      if (cue !== lastUiCueRef.current || result.repCompleted) {
        lastUiCueRef.current = cue;
        setLastResult(result);
      } else if (now - lastProgressPublishRef.current > 120) {
        // Periodically refresh metrics without spamming identical cues.
        lastProgressPublishRef.current = now;
        setLastResult(result);
      }

      // Batch form score updates — mismatch frames weigh heavily so
      // a brief wrong-move can't leave form at 100%.
      const isMismatch =
        result.metrics.mismatch === 1 || result.metrics.plank === 1;
      if (isMismatch) {
        formTotalRef.current += 4;
        // no form hit
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
        // Only store real form problems for the end-of-session review
        if (c && !result.formOk) {
          setMistakes((prev) =>
            prev.includes(c) ? prev : [...prev, c].slice(-8),
          );
        }
      }

      // Hard gate: wrong exercise / bad form / not ready → never count
      const canCount =
        result.repCompleted &&
        result.ready &&
        result.formOk &&
        result.metrics.mismatch !== 1 &&
        result.metrics.plank !== 1;

      if (canCount) {
        setRepPulse((n) => n + 1);
        setTotalReps((n) => n + 1);
        setReps((r) => {
          const next = r + 1;
          if (next >= targetRepsRef.current) {
            setSetsCompleted((s) => Math.min(targetSetsRef.current, s + 1));
            currentTracker.reset();
            return 0;
          }
          return next;
        });
      }
    },
    [active, exerciseName],
  );

  const formScore = useMemo(() => {
    if (formTotal === 0) return 100;
    return Math.round((formHits / formTotal) * 100);
  }, [formHits, formTotal]);

  const resetSession = useCallback(() => {
    trackerRef.current?.reset();
    setReps(0);
    setSetsCompleted(0);
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
    goodMsRef.current = 0;
    lastUiCueRef.current = "";
    setRepPulse(0);
    setTotalReps(0);
    startedAtRef.current = performance.now();
  }, []);

  const pauseCounting = useCallback(() => {
    countingRef.current = false;
    setCounting(false);
  }, []);

  const resumeCounting = useCallback(() => {
    if (calibratedRef.current) {
      countingRef.current = true;
      setCounting(true);
    }
  }, []);

  const metrics = lastResult?.metrics ?? EMPTY_METRICS;
  const issueLandmarks = lastResult?.issueLandmarks ?? EMPTY_LANDMARKS;
  const wholeExerciseWrong = isWholeExerciseWrong(metrics);
  const landmarkKey = issueLandmarks.join(",");

  const issueBodyParts = useMemo(() => {
    if (!landmarkKey) return EMPTY_BODY_PARTS as string[];
    return bodyPartLabels(issueLandmarks as number[]);
  }, [landmarkKey, issueLandmarks]);

  const stats: SessionStats = {
    reps,
    setsCompleted,
    targetSets,
    targetReps,
    elapsedSec,
    formScore,
    mistakes,
    cue:
      lastResult?.cues[0] ??
      (calibrated ? "Looking good — keep going" : "Get fully in frame"),
    phase: lastResult?.phase ?? "idle",
    metrics,
    calibrated,
    calibrationProgress,
    counting,
    formOk: lastResult?.formOk ?? true,
    issueLandmarks: issueLandmarks as number[],
    issueBodyParts: issueBodyParts as string[],
    wholeExerciseWrong,
    repPulse,
    totalReps,
  };

  return {
    stats,
    processFrame,
    resetSession,
    pauseCounting,
    resumeCounting,
    lastResult,
  };
}
