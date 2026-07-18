"use client";

import { ProfileForm } from "./ProfileForm";
import { useGeneratePlan } from "../hooks/useGeneratePlan";

export function PlanGenerator() {
  const { generate, loading, error, step } = useGeneratePlan();

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="rounded-2xl border border-[var(--fit-accent)]/30 bg-[var(--fit-accent-soft)] px-4 py-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--fit-accent)]" />
            <div>
              <p className="font-semibold text-[var(--fit-ink)]">{step || "Working…"}</p>
              <p className="mt-0.5 text-[var(--fit-muted)]">
                Filtering your DB exercises, then calling Cursor AI for Day 1…
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}
      <ProfileForm onSubmit={generate} loading={loading} />
    </div>
  );
}
