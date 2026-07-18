"use client";

import type { PlanDay } from "../types";

type WeeklyProgressProps = {
  days: PlanDay[];
  currentDay: number;
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
};

function statusLabel(day: PlanDay, currentDay: number) {
  if (day.status === "completed") return "Done";
  if (day.dayNumber === currentDay) return "Today";
  if (day.status === "locked") return "Locked";
  if (day.isRestDay) return "Rest";
  return "Ready";
}

export function WeeklyProgress({
  days,
  currentDay,
  selectedDay,
  onSelectDay,
}: WeeklyProgressProps) {
  const weeks = [1, 2, 3, 4] as const;
  const completed = days.filter((d) => d.status === "completed").length;
  const progress = Math.round((completed / Math.max(days.length, 1)) * 100);
  const activeWeek = Math.ceil(currentDay / 7);

  return (
    <aside className="space-y-5 rounded-[1.5rem] border border-[var(--fit-border)] bg-[var(--fit-surface)] p-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--fit-muted)]">
          <span>
            Day {currentDay} of {days.length}
          </span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--fit-border)]">
          <div
            className="h-full rounded-full bg-[var(--fit-accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {weeks.map((week) => {
        const weekDays = days.filter((d) => d.weekNumber === week);
        const isActiveWeek = week === activeWeek;
        return (
          <div key={week} className={isActiveWeek ? "" : "opacity-70"}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--fit-muted)]">
              Week {week}
              {isActiveWeek ? " · current" : ""}
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {weekDays.map((day) => {
                const selected = day.dayNumber === selectedDay;
                const clickable = day.status !== "locked";
                return (
                  <button
                    key={day.dayNumber}
                    type="button"
                    disabled={!clickable}
                    title={`Day ${day.dayNumber}: ${day.focus} (${statusLabel(day, currentDay)})`}
                    onClick={() => onSelectDay(day.dayNumber)}
                    className={`flex flex-col items-center rounded-xl border px-1 py-2 text-[10px] transition ${
                      selected
                        ? "border-[var(--fit-accent)] bg-[var(--fit-accent)] text-white"
                        : day.status === "completed"
                          ? "border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                          : day.status === "locked"
                            ? "cursor-not-allowed border-[var(--fit-border)] text-[var(--fit-muted)]/50"
                            : "border-[var(--fit-border)] text-[var(--fit-ink)] hover:border-[var(--fit-accent)]"
                    }`}
                  >
                    <span className="font-semibold">{day.dayNumber}</span>
                    <span className="mt-0.5 truncate max-w-full">
                      {day.isRestDay ? "R" : day.focus.split(" ")[0]?.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
