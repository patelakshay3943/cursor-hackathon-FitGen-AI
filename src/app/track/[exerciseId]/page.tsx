"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { MotionTracker } from "@/modules/tracking";
import { planPath, ROUTES } from "@/shared/constants";

type PageProps = { params: Promise<{ exerciseId: string }> };

function parseReps(raw: string | null): number {
  if (!raw) return 10;
  const m = raw.match(/\d+/);
  return m ? Math.min(30, Math.max(1, Number(m[0]))) : 10;
}

function TrackSession({ exerciseId }: { exerciseId: string }) {
  const search = useSearchParams();
  const decodedId = decodeURIComponent(exerciseId);
  const name =
    search.get("name") || decodeURIComponent(exerciseId.replace(/_/g, " "));
  const sets = Math.min(10, Math.max(1, Number(search.get("sets") || 3)));
  const reps = parseReps(search.get("reps"));
  const planId = search.get("planId");
  const backHref = planId ? planPath(planId) : ROUTES.home;

  return (
    <MotionTracker
      exerciseId={decodedId}
      exerciseName={name}
      targetSets={sets}
      targetReps={reps}
      backHref={backHref}
    />
  );
}

export default function TrackPage({ params }: PageProps) {
  const { exerciseId } = use(params);

  return (
    <main className="w-full flex-1 max-md:p-0 md:mx-auto md:max-w-4xl md:px-4 md:py-8">
      <Suspense
        fallback={
          <p className="px-4 py-8 text-sm text-[var(--fit-muted)]">
            Loading tracker…
          </p>
        }
      >
        <TrackSession exerciseId={exerciseId} />
      </Suspense>
    </main>
  );
}
