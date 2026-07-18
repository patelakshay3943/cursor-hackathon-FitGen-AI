"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/config/app";
import { ROUTES, planPath } from "@/shared/constants";
import { PLAN_STORAGE_EVENT, getStoredPlanId } from "@/modules/plan";

const linkClass =
  "text-sm text-[var(--fit-muted)] transition hover:text-[var(--fit-ink)]";

export function Navbar() {
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setPlanId(getStoredPlanId());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PLAN_STORAGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PLAN_STORAGE_EVENT, sync);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--fit-border)] bg-[var(--fit-surface)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href={ROUTES.home}
          className="font-display text-base font-semibold tracking-tight text-[var(--fit-ink)]"
        >
          {APP_NAME}
        </Link>
        <nav className="flex flex-wrap items-center gap-4">
          <Link className={linkClass} href={ROUTES.generate}>
            Assessment
          </Link>
          {planId ? (
            <Link className={linkClass} href={planPath(planId)}>
              My Plan
            </Link>
          ) : (
            <span className="text-sm text-[var(--fit-border)]">My Plan</span>
          )}
          <Link className={linkClass} href={ROUTES.exercises}>
            Exercises
          </Link>
        </nav>
      </div>
    </header>
  );
}
