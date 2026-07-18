"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { TodayWorkoutView, usePlanProgress, savePlanId } from "@/modules/plan";
import { ROUTES } from "@/shared/constants";
import { PageSkeleton } from "@/shared/components/ui/PageSkeleton";
import { EmptyState } from "@/shared/components/ui/EmptyState";

type PageProps = { params: Promise<{ id: string }> };

export default function PlanPage({ params }: PageProps) {
  const { id } = use(params);
  const { plan, loading, completing, error, message, completeDay } = usePlanProgress(id);

  useEffect(() => {
    if (id) savePlanId(id);
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <PageSkeleton rows={5} />
      </main>
    );
  }

  if (error || !plan) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <EmptyState
          title="Plan not found"
          description={error || "This plan link may be invalid or expired."}
          actionLabel="Start a new assessment"
          actionHref={ROUTES.generate}
        />
        <p className="mt-4 text-center text-sm text-[var(--fit-muted)]">
          Or go{" "}
          <Link href={ROUTES.home} className="font-medium text-[var(--fit-accent)] underline">
            home
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
      <TodayWorkoutView
        plan={plan}
        completing={completing}
        message={message}
        onCompleteDay={completeDay}
      />
    </main>
  );
}
