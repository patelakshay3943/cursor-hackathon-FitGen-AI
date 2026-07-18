"use client";

import type { PlanDay } from "../types";

type LockedDayCardProps = {
  day: PlanDay;
  previousDayNumber?: number;
};

export function LockedDayCard({ day, previousDayNumber }: LockedDayCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--fit-border)] bg-[var(--fit-surface)] px-6 py-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fit-muted)]">
        Locked
      </p>
      <p className="mt-3 font-display text-2xl font-semibold text-[var(--fit-ink)]">
        Day {day.dayNumber} — {day.focus}
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-[var(--fit-muted)]">
        {previousDayNumber
          ? `Complete Day ${previousDayNumber} to unlock. Cursor AI will then generate this workout from your exercise database.`
          : "Complete the previous day to unlock this workout."}
      </p>
    </div>
  );
}
