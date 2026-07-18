"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiPost } from "@/shared/services/http";
import { buildLocalSuggestion } from "../lib/pose/formHighlights";

type LiveCoachState = {
  displayCue: string;
  suggestion: string;
  aiGenerated: boolean;
  loading: boolean;
};

const THROTTLE_MS = 5_000;
const CLEAR_HOLD_MS = 1200;

/**
 * Instant local suggestion + Cursor LLM rewrite within ~5 seconds.
 */
export function useLlmLiveCoach(params: {
  enabled: boolean;
  isFormIssue: boolean;
  exerciseName: string;
  ruleCue: string;
  formScore: number;
  phase: string;
  metrics: Record<string, number>;
  formOk: boolean;
  issueBodyParts: string[];
  wholeExerciseWrong: boolean;
}) {
  const {
    enabled,
    isFormIssue,
    exerciseName,
    ruleCue,
    formScore,
    phase,
    metrics,
    formOk,
    issueBodyParts,
    wholeExerciseWrong,
  } = params;

  const bodyPartsKey = issueBodyParts.join(",");

  const localSuggestion = useMemo(
    () =>
      buildLocalSuggestion(
        ruleCue,
        issueBodyParts,
        wholeExerciseWrong,
        exerciseName,
      ),
    [ruleCue, bodyPartsKey, wholeExerciseWrong, exerciseName, issueBodyParts],
  );

  const [state, setState] = useState<LiveCoachState>(() => ({
    displayCue: ruleCue,
    suggestion: buildLocalSuggestion(
      ruleCue,
      issueBodyParts,
      wholeExerciseWrong,
      exerciseName,
    ),
    aiGenerated: false,
    loading: false,
  }));

  const lastFetchRef = useRef(0);
  const inFlightRef = useRef(false);
  const lastKeyRef = useRef("");
  const requestIdRef = useRef(0);
  const clearTimerRef = useRef<number | null>(null);
  const latestRef = useRef({
    formScore,
    phase,
    metrics,
    formOk,
    ruleCue,
    localSuggestion,
    issueBodyParts,
  });
  latestRef.current = {
    formScore,
    phase,
    metrics,
    formOk,
    ruleCue,
    localSuggestion,
    issueBodyParts,
  };

  // Instant local suggestion when form breaks — skip redundant updates
  useEffect(() => {
    if (!enabled || !isFormIssue) return;
    setState((s) => {
      const nextCue = ruleCue || s.displayCue;
      if (s.displayCue === nextCue && s.suggestion === localSuggestion) return s;
      return {
        ...s,
        displayCue: nextCue,
        suggestion: localSuggestion,
      };
    });
  }, [enabled, isFormIssue, ruleCue, localSuggestion]);

  useEffect(() => {
    if (!enabled) return;

    if (!isFormIssue) {
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = window.setTimeout(() => {
        setState((s) => {
          if (
            s.displayCue === ruleCue &&
            s.suggestion === localSuggestion &&
            !s.aiGenerated &&
            !s.loading
          ) {
            return s;
          }
          return {
            ...s,
            displayCue: ruleCue,
            suggestion: localSuggestion,
            aiGenerated: false,
            loading: false,
          };
        });
      }, CLEAR_HOLD_MS);
      return;
    }

    if (clearTimerRef.current) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    const key = `${exerciseName}::${ruleCue}::${bodyPartsKey}`;
    const now = Date.now();
    if (
      inFlightRef.current ||
      (key === lastKeyRef.current && now - lastFetchRef.current < THROTTLE_MS)
    ) {
      return;
    }

    lastKeyRef.current = key;
    lastFetchRef.current = now;
    inFlightRef.current = true;
    const reqId = ++requestIdRef.current;
    setState((s) => (s.loading ? s : { ...s, loading: true }));

    const snap = latestRef.current;
    void apiPost<{ alert: string; aiGenerated: boolean }>("/api/coach/live", {
      exerciseName,
      ruleCue: snap.ruleCue,
      formScore: snap.formScore,
      phase: snap.phase,
      metrics: {
        ...snap.metrics,
        bodyParts: snap.issueBodyParts.join(", "),
      },
      formOk: snap.formOk,
    })
      .then((res) => {
        if (reqId !== requestIdRef.current) return;
        const alert = res.alert || snap.ruleCue;
        setState({
          displayCue: alert,
          suggestion: alert,
          aiGenerated: Boolean(res.aiGenerated),
          loading: false,
        });
      })
      .catch(() => {
        if (reqId !== requestIdRef.current) return;
        setState((s) => ({
          displayCue: snap.ruleCue || s.displayCue,
          suggestion: snap.localSuggestion || s.suggestion,
          aiGenerated: false,
          loading: false,
        }));
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [
    enabled,
    isFormIssue,
    exerciseName,
    ruleCue,
    bodyPartsKey,
    localSuggestion,
  ]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    };
  }, []);

  return state;
}
