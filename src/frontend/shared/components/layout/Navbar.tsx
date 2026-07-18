"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/config/app";
import { ROUTES, planPath } from "@/shared/constants";
import { PLAN_STORAGE_EVENT, getStoredPlanId } from "@/modules/plan";

const linkClass =
  "text-sm font-medium text-[var(--fit-muted)] transition hover:text-[var(--fit-ink)]";

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
    <header className="sticky top-0 z-20 border-b border-[var(--fit-border)] bg-[var(--fit-surface)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href={ROUTES.home}
          className="font-display text-base font-semibold tracking-tight text-[var(--fit-ink)]"
        >
          {APP_NAME}
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Link className={`${linkClass} rounded-full px-3 py-1.5 hover:bg-[var(--fit-accent-soft)]`} href={ROUTES.generate}>
            Assessment
          </Link>
          {planId ? (
            <Link
              className={`${linkClass} rounded-full px-3 py-1.5 hover:bg-[var(--fit-accent-soft)]`}
              href={planPath(planId)}
            >
              My Plan
            </Link>
          ) : null}
          <Link className={`${linkClass} rounded-full px-3 py-1.5 hover:bg-[var(--fit-accent-soft)]`} href={ROUTES.exercises}>
            Exercises
          </Link>
          <Link
            href={ROUTES.generate}
            className="ml-1 hidden rounded-full bg-[var(--fit-accent)] px-3.5 py-1.5 text-xs font-semibold text-white sm:inline-flex"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
