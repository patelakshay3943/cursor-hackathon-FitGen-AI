"use client";

import type { PlanDay } from "../types";
import { ExerciseCard } from "./ExerciseCard";

type WorkoutDayCardProps = {
  day: PlanDay;
  planId?: string;
};

export function WorkoutDayCard({ day, planId }: WorkoutDayCardProps) {
  if (day.isRestDay) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--fit-border)] bg-[var(--fit-surface)] px-4 py-10 text-center">
        <p className="font-display text-xl font-semibold text-[var(--fit-ink)]">Rest day</p>
        <p className="mt-2 text-sm text-[var(--fit-muted)]">
          {day.workout?.coachTip ||
            "Recover, hydrate, and come back stronger tomorrow."}
        </p>
      </div>
    );
  }

  const exercises = day.workout?.exercises ?? [];
  const tip = day.workout?.coachTip;
  const ai = day.workout?.aiGenerated;

  if (day.status === "generating") {
    return (
      <div className="rounded-2xl border border-[var(--fit-border)] px-4 py-10 text-center">
        <p className="text-sm text-[var(--fit-muted)]">Cursor AI is generating this workout…</p>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--fit-border)] px-4 py-10 text-center">
        <p className="text-sm text-[var(--fit-muted)]">No exercises for this day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {ai ? (
          <span className="rounded-full bg-[var(--fit-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--fit-accent)]">
            AI generated
          </span>
        ) : (
          <span className="rounded-full bg-[var(--fit-bg)] px-2.5 py-1 text-xs font-medium text-[var(--fit-muted)]">
            Local rules
          </span>
        )}
        <span className="text-xs text-[var(--fit-muted)]">
          {exercises.length} exercises · from your exercise database
        </span>
      </div>
      {tip ? (
        <blockquote className="rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-accent-soft)] px-4 py-3 text-sm text-[var(--fit-ink)]">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--fit-accent)]">
            Coach tip
          </span>
          <p className="mt-1 leading-relaxed">{tip}</p>
        </blockquote>
      ) : null}
      <div className="space-y-3">
        {exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.exerciseId}
            exercise={ex}
            index={i}
            planId={planId}
          />
        ))}
      </div>
    </div>
  );
}
