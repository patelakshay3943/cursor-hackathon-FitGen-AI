"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/shared/services/http";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { Label } from "@/shared/components/ui/Label";

type ExerciseItem = {
  id: string;
  name: string;
  level: string;
  equipment: string | null;
  category: string;
  primaryMuscles: string[];
  imageUrls: string[];
};

export default function ExercisesPage() {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(search?: string, muscleFilter?: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (muscleFilter) params.set("muscle", muscleFilter);
      params.set("limit", "40");
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Exercise library
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Browse the free-exercise-db catalog used to build your plans.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void load(q, muscle);
        }}
      >
        <div className="min-w-[180px] flex-1 space-y-1">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. squat"
          />
        </div>
        <div className="min-w-[160px] space-y-1">
          <Label htmlFor="muscle">Muscle</Label>
          <Input
            id="muscle"
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
            placeholder="e.g. chest"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {exercises.map((ex) => (
          <article
            key={ex.id}
            className="flex gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
          >
            {ex.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ex.imageUrls[0]}
                alt={ex.name}
                className="h-20 w-24 rounded-lg object-cover"
                loading="lazy"
              />
            ) : null}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {ex.name}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {ex.level} · {ex.equipment || "any"} · {(ex.primaryMuscles ?? []).join(", ")}
              </p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
