"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/shared/services/http";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { PageSkeleton } from "@/shared/components/ui/PageSkeleton";
import { EmptyState } from "@/shared/components/ui/EmptyState";

type ExerciseItem = {
  id: string;
  name: string;
  level: string;
  equipment: string | null;
  category: string;
  primaryMuscles: string[];
  imageUrls: string[];
};

const MUSCLE_CHIPS = [
  "chest",
  "lats",
  "shoulders",
  "biceps",
  "triceps",
  "quadriceps",
  "hamstrings",
  "glutes",
  "abdominals",
];

export default function ExercisesPage() {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(search?: string, muscleFilter?: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (muscleFilter) params.set("muscle", muscleFilter);
      params.set("limit", "48");
      const data = await apiGet<{ exercises: ExerciseItem[] }>(
        `/api/exercises?${params.toString()}`,
      );
      setExercises(data.exercises);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const resultLabel = useMemo(() => {
    if (loading) return "Searching…";
    if (q || muscle) return `${exercises.length} matches`;
    return `${exercises.length} exercises`;
  }, [loading, q, muscle, exercises.length]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="fit-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fit-accent)]">
          Library
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--fit-ink)]">
          Exercise library
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--fit-muted)]">
          Same catalog FitGen uses when AI builds your daily workouts.
        </p>
      </div>

      <form
        className="rounded-[1.5rem] border border-[var(--fit-border)] bg-[var(--fit-surface)] p-4 sm:p-5 fit-fade-up fit-delay-1"
        onSubmit={(e) => {
          e.preventDefault();
          void load(q, muscle);
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="q" className="text-sm font-medium text-[var(--fit-ink)]">
              Search by name
            </label>
            <Input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. squat, press, row"
            />
          </div>
          <Button type="submit" disabled={loading} className="sm:mb-0.5">
            {loading ? "Searching…" : "Search"}
          </Button>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--fit-muted)]">
            Filter by muscle
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMuscle("");
                void load(q, "");
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                !muscle
                  ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] text-[var(--fit-accent)]"
                  : "border-[var(--fit-border)] text-[var(--fit-muted)]"
              }`}
            >
              All
            </button>
            {MUSCLE_CHIPS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  const next = muscle === m ? "" : m;
                  setMuscle(next);
                  void load(q, next);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                  muscle === m
                    ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] text-[var(--fit-accent)]"
                    : "border-[var(--fit-border)] text-[var(--fit-muted)] hover:border-[var(--fit-accent)]/40"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div className="flex items-center justify-between text-sm text-[var(--fit-muted)]">
        <span>{resultLabel}</span>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <PageSkeleton rows={6} />
      ) : exercises.length === 0 ? (
        <EmptyState
          title="No exercises found"
          description="Try a different search term or clear the muscle filter."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 fit-fade-up">
          {exercises.map((ex) => (
            <article
              key={ex.id}
              className="group flex gap-3 overflow-hidden rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-surface)] p-3 transition hover:border-[var(--fit-accent)]/40 hover:shadow-sm"
            >
              {ex.imageUrls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ex.imageUrls[0]}
                  alt={ex.name}
                  className="h-24 w-28 shrink-0 rounded-xl object-cover transition group-hover:scale-[1.02]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-24 w-28 shrink-0 items-center justify-center rounded-xl bg-[var(--fit-bg)] text-xs text-[var(--fit-muted)]">
                  No image
                </div>
              )}
              <div className="min-w-0 py-0.5">
                <h2 className="truncate font-medium text-[var(--fit-ink)]">{ex.name}</h2>
                <p className="mt-1 text-xs capitalize text-[var(--fit-muted)]">
                  {ex.level} · {ex.equipment || "any equipment"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(ex.primaryMuscles ?? []).slice(0, 3).map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-[var(--fit-accent-soft)] px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--fit-accent)]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
