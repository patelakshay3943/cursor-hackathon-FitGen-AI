"use client";

import { useState } from "react";
import type { PlanDay, PlanResponse } from "../types";
import { GOAL_OPTIONS, LEVEL_OPTIONS } from "../types";
import { CompleteDayButton } from "./CompleteDayButton";
import { LockedDayCard } from "./LockedDayCard";
import { WeeklyProgress } from "./WeeklyProgress";
import { WorkoutDayCard } from "./WorkoutDayCard";

type TodayWorkoutViewProps = {
  plan: PlanResponse;
  completing?: boolean;
  message?: string | null;
  onCompleteDay: (dayNumber: number) => unknown;
};

export function TodayWorkoutView({
  plan,
  completing,
  message,
  onCompleteDay,
}: TodayWorkoutViewProps) {
  const [manualDay, setManualDay] = useState<number | null>(null);
  const selectedDay = manualDay ?? plan.currentDay;

  const day: PlanDay | undefined = plan.days.find((d) => d.dayNumber === selectedDay);
  const currentMeta = plan.days.find((d) => d.dayNumber === plan.currentDay);
  const isCurrent = day?.dayNumber === plan.currentDay;
  const canComplete = Boolean(isCurrent && day && day.status === "ready");

  const goalLabel =
    GOAL_OPTIONS.find((g) => g.value === plan.profile?.goal)?.label ?? plan.profile?.goal;
  const levelLabel =
    LEVEL_OPTIONS.find((l) => l.value === plan.profile?.level)?.label ?? plan.profile?.level;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fit-accent)]">
          {plan.splitType} · 28-day progressive plan
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--fit-ink)] sm:text-4xl">
          Day {plan.currentDay} of 28
          {currentMeta ? ` — ${currentMeta.focus}` : ""}
        </h1>
        <p className="text-sm text-[var(--fit-muted)]">
          {[goalLabel, levelLabel, `${plan.profile?.daysPerWeek ?? "?"} days/week`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <WeeklyProgress
          days={plan.days}
          currentDay={plan.currentDay}
          selectedDay={selectedDay}
          onSelectDay={setManualDay}
        />

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-[var(--fit-ink)]">
              {isCurrent ? "Today's workout" : `Day ${selectedDay}`}
            </h2>
            {day && !day.isRestDay && day.status !== "locked" ? (
              <p className="text-xs text-[var(--fit-muted)]">{day.focus}</p>
            ) : null}
          </div>

          {!day ? (
            <p className="text-sm text-[var(--fit-muted)]">Day not found.</p>
          ) : day.status === "locked" ? (
            <LockedDayCard day={day} previousDayNumber={day.dayNumber - 1} />
          ) : (
            <>
              <WorkoutDayCard day={day} />
              {canComplete ? (
                <div className="sticky bottom-4 rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-surface)]/95 p-4 shadow-lg backdrop-blur">
                  <CompleteDayButton
                    dayNumber={day.dayNumber}
                    loading={completing}
                    isLastDay={day.dayNumber >= 28}
                    onComplete={() => {
                      setManualDay(null);
                      return onCompleteDay(day.dayNumber);
                    }}
                  />
                </div>
              ) : null}
              {day.status === "completed" ? (
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Completed
                  {day.completedAt
                    ? ` on ${new Date(day.completedAt).toLocaleString()}`
                    : ""}
                </p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
