"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/shared/services/http";
import type { PlanResponse } from "../types";

export function usePlanProgress(planId: string) {
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PlanResponse>(`/api/plans/${planId}`);
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completeDay = useCallback(
    async (dayNumber: number) => {
      setCompleting(true);
      setError(null);
      setMessage(null);
      try {
        const data = await apiPost<PlanResponse>(
          `/api/plans/${planId}/days/${dayNumber}/complete`,
        );
        setPlan(data);
        setMessage(data.message ?? `Day ${dayNumber} completed`);
        window.setTimeout(() => setMessage(null), 5000);
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to complete day";
        setError(msg);
        throw err;
      } finally {
        setCompleting(false);
      }
    },
    [planId],
  );

  return { plan, loading, completing, error, message, refresh, completeDay };
}
