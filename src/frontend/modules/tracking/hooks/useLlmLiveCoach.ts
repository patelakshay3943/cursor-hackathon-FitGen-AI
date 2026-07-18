"use client";

import { useEffect, useRef, useState } from "react";
import { apiPost } from "@/shared/services/http";

type LiveCoachState = {
  displayCue: string;
  aiGenerated: boolean;
  loading: boolean;
};

const THROTTLE_MS = 12_000;

/**
 * When form is wrong, ask Cursor LLM to rewrite the alert (throttled).
 * Pose detection stays local/rule-based for speed.
 */
export function useLlmLiveCoach(params: {
  enabled: boolean;
  isWrong: boolean;
  exerciseName: string;
  ruleCue: string;
  formScore: number;
  phase: string;
  metrics: Record<string, number>;
  formOk: boolean;
}) {
  const {
    enabled,
    isWrong,
    exerciseName,
    ruleCue,
    formScore,
    phase,
    metrics,
    formOk,
  } = params;

  const [state, setState] = useState<LiveCoachState>({
    displayCue: ruleCue,
    aiGenerated: false,
    loading: false,
  });

  const lastFetchRef = useRef(0);
  const inFlightRef = useRef(false);
  const lastKeyRef = useRef("");
  const requestIdRef = useRef(0);
  const latestRef = useRef({ formScore, phase, metrics, formOk, ruleCue });
  latestRef.current = { formScore, phase, metrics, formOk, ruleCue };

  useEffect(() => {
    if (!enabled || !isWrong) {
      setState({ displayCue: ruleCue, aiGenerated: false, loading: false });
      return;
    }

    // Show rule cue immediately while LLM runs
    setState((s) => ({
      displayCue: s.aiGenerated && s.displayCue ? s.displayCue : ruleCue,
      aiGenerated: s.aiGenerated,
      loading: s.loading,
    }));

    const key = `${exerciseName}::${ruleCue}`;
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
    setState((s) => ({ ...s, loading: true }));

    const snap = latestRef.current;
    void apiPost<{ alert: string; aiGenerated: boolean }>("/api/coach/live", {
      exerciseName,
      ruleCue: snap.ruleCue,
      formScore: snap.formScore,
      phase: snap.phase,
      metrics: snap.metrics,
      formOk: snap.formOk,
    })
      .then((res) => {
        if (reqId !== requestIdRef.current) return;
        setState({
          displayCue: res.alert || snap.ruleCue,
          aiGenerated: Boolean(res.aiGenerated),
          loading: false,
        });
      })
      .catch(() => {
        if (reqId !== requestIdRef.current) return;
        setState({
          displayCue: snap.ruleCue,
          aiGenerated: false,
          loading: false,
        });
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [enabled, isWrong, exerciseName, ruleCue]);

  return state;
}
