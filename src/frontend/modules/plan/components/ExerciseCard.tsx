"use client";

import { useState } from "react";
import type { WorkoutExercise } from "../types";

type ExerciseCardProps = {
  exercise: WorkoutExercise;
  index?: number;
};

export function ExerciseCard({ exercise, index = 0 }: ExerciseCardProps) {
  const [open, setOpen] = useState(false);
  const image = exercise.imageUrls?.[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-surface)]">
      <div className="flex flex-col gap-3 p-4 sm:flex-row">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={exercise.name}
            className="h-32 w-full rounded-xl object-cover sm:h-28 sm:w-36"
            loading="lazy"
          />
        ) : (
          <div className="flex h-28 w-full items-center justify-center rounded-xl bg-[var(--fit-bg)] text-xs text-[var(--fit-muted)] sm:w-36">
            No image
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-[var(--fit-accent)]">
                Exercise {index + 1}
                {exercise.mechanic ? ` · ${exercise.mechanic}` : ""}
              </p>
              <h3 className="font-display text-lg font-semibold text-[var(--fit-ink)]">
                {exercise.name}
              </h3>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--fit-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--fit-accent)]">
              {exercise.sets} sets
            </span>
            <span className="rounded-full bg-[var(--fit-bg)] px-2.5 py-1 text-xs font-medium text-[var(--fit-ink)]">
              {exercise.reps} reps
            </span>
            <span className="rounded-full bg-[var(--fit-bg)] px-2.5 py-1 text-xs font-medium text-[var(--fit-muted)]">
              Rest {exercise.restSec}s
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--fit-muted)]">
            {(exercise.primaryMuscles ?? []).join(" · ")}
            {exercise.equipment ? ` · ${exercise.equipment}` : ""}
          </p>
          {exercise.notes ? (
            <p className="mt-2 text-xs italic text-[var(--fit-accent)]">{exercise.notes}</p>
          ) : null}
          {(exercise.instructions?.length ?? 0) > 0 ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="mt-3 text-xs font-semibold text-[var(--fit-accent)] hover:underline"
            >
              {open ? "Hide how-to" : "How to perform"}
            </button>
          ) : null}
        </div>
      </div>
      {open ? (
        <ol className="space-y-2 border-t border-[var(--fit-border)] bg-[var(--fit-bg)] px-4 py-3 text-xs leading-relaxed text-[var(--fit-muted)]">
          {(exercise.instructions ?? []).map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-semibold text-[var(--fit-accent)]">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  );
}
