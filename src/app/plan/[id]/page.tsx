"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { TodayWorkoutView, usePlanProgress, savePlanId } from "@/modules/plan";
import { ROUTES } from "@/shared/constants";

type PageProps = { params: Promise<{ id: string }> };

export default function PlanPage({ params }: PageProps) {
  const { id } = use(params);
  const { plan, loading, completing, error, message, completeDay } = usePlanProgress(id);

  useEffect(() => {
    if (id) savePlanId(id);
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-zinc-500">Loading your plan…</p>
      </main>
    );
  }

  if (error || !plan) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        <p className="text-sm text-red-600">{error || "Plan not found"}</p>
        <Link href={ROUTES.generate} className="text-sm underline">
          Generate a new plan
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <TodayWorkoutView
        plan={plan}
        completing={completing}
        message={message}
        onCompleteDay={completeDay}
      />
    </main>
  );
}
