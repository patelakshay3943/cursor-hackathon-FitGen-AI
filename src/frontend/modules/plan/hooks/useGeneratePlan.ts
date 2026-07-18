"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/shared/services/http";
import { savePlanIdToSession, saveProfile } from "@/shared/lib/sessionPerson";
import type { PlanResponse, UserProfile } from "../types";
import { savePlanId } from "../types";

export function useGeneratePlan() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>("");

  const generate = useCallback(
    async (profile: UserProfile) => {
      setLoading(true);
      setError(null);
      try {
        setStep("Filtering exercises from database…");
        await new Promise((r) => setTimeout(r, 150));
        setStep("Cursor AI is building Day 1…");
        saveProfile(profile);
        const result = await apiPost<PlanResponse>("/api/plans/generate", profile);
        savePlanId(result.planId);
        savePlanIdToSession(result.planId);
        setStep("Day 1 ready!");
        router.push(`/plan/${result.planId}`);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate plan";
        setError(message);
        setStep("");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  return { generate, loading, error, step };
}
