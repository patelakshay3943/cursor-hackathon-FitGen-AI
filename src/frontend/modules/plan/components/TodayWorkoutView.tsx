"use client";

import { useMemo, useState } from "react";
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

function estimateMinutes(day: PlanDay | undefined, sessionMinutes?: number) {
  if (!day || day.isRestDay) return 0;
  const exercises = day.workout?.exercises ?? [];
  if (exercises.length === 0) return sessionMinutes ?? 45;
  const work =
    exercises.reduce((sum, ex) => sum + ex.sets * 45 + ex.sets * ex.restSec, 0) / 60;
  return Math.max(20, Math.round(work / 5) * 5);
}

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
  const completedCount = plan.days.filter((d) => d.status === "completed").length;
  const est = useMemo(
    () => estimateMinutes(day, plan.profile?.sessionMinutes),
    [day, plan.profile?.sessionMinutes],
  );

  const goalLabel =
    GOAL_OPTIONS.find((g) => g.value === plan.profile?.goal)?.label ?? plan.profile?.goal;
  const levelLabel =
    LEVEL_OPTIONS.find((l) => l.value === plan.profile?.level)?.label ?? plan.profile?.level;

  return (
    <div className="space-y-6 fit-fade-up">
      <header className="overflow-hidden rounded-[1.75rem] border border-[var(--fit-border)] bg-[var(--fit-surface)] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fit-accent)]">
              {plan.splitType} · Day {plan.currentDay} / 28
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--fit-ink)] sm:text-4xl">
              {currentMeta?.isRestDay
                ? "Recovery day"
                : currentMeta
                  ? currentMeta.focus
                  : "Your workout"}
            </h1>
            <p className="text-sm text-[var(--fit-muted)]">
              {[goalLabel, levelLabel, `${plan.profile?.daysPerWeek ?? "?"} days/week`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl bg-[var(--fit-accent-soft)] px-3.5 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fit-accent)]">
                Done
              </p>
              <p className="font-display text-lg font-semibold text-[var(--fit-ink)]">
                {completedCount}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--fit-bg)] px-3.5 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fit-muted)]">
                Left
              </p>
              <p className="font-display text-lg font-semibold text-[var(--fit-ink)]">
                {28 - completedCount}
              </p>
            </div>
            {!currentMeta?.isRestDay ? (
              <div className="rounded-2xl bg-[var(--fit-bg)] px-3.5 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fit-muted)]">
                  ~Time
                </p>
                <p className="font-display text-lg font-semibold text-[var(--fit-ink)]">
                  {est}m
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {message ? (
        <div className="rounded-2xl border border-[var(--fit-accent)]/30 bg-[var(--fit-accent-soft)] px-4 py-3 text-sm text-[var(--fit-ink)] fit-fade-in">
          <span className="font-semibold text-[var(--fit-accent)]">Nice work. </span>
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <WeeklyProgress
          days={plan.days}
          currentDay={plan.currentDay}
          selectedDay={selectedDay}
          onSelectDay={setManualDay}
        />

        <section className="space-y-4 fit-fade-up fit-delay-1">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-[var(--fit-ink)]">
                {isCurrent ? "Today’s session" : `Day ${selectedDay}`}
              </h2>
              {day ? (
                <p className="mt-0.5 text-xs text-[var(--fit-muted)]">
                  {day.focus}
                  {!day.isRestDay && day.status !== "locked" ? ` · ~${est} min` : ""}
                </p>
              ) : null}
            </div>
          </div>

          {!day ? (
            <p className="text-sm text-[var(--fit-muted)]">Day not found.</p>
          ) : day.status === "locked" ? (
            <LockedDayCard day={day} previousDayNumber={day.dayNumber - 1} />
          ) : (
            <>
              <WorkoutDayCard day={day} />
              {canComplete ? (
                <div className="sticky bottom-4 z-10 rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-surface)]/95 p-4 shadow-[0_12px_40px_rgba(20,32,27,0.12)] backdrop-blur">
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
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  Completed
                  {day.completedAt
                    ? ` · ${new Date(day.completedAt).toLocaleString()}`
                    : ""}
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
