"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/config/app";
import { ROUTES, planPath } from "@/shared/constants";
import { PLAN_STORAGE_EVENT, getStoredPlanId } from "@/modules/plan";
import { getGoalAffirmation } from "@/modules/tracking/lib/affirmations";
import {
  PERSON_SESSION_EVENT,
  getProfileFromSession,
} from "@/shared/lib/sessionPerson";

const linkClass =
  "whitespace-nowrap text-sm font-medium text-[var(--fit-muted)] transition hover:text-[var(--fit-ink)]";

export function Navbar() {
  const pathname = usePathname();
  const [planId, setPlanId] = useState<string | null>(null);
  const [goalLabel, setGoalLabel] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      setPlanId(getStoredPlanId());
      const profile = getProfileFromSession();
      setGoalLabel(profile ? getGoalAffirmation(profile).becoming : null);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PLAN_STORAGE_EVENT, sync);
    window.addEventListener(PERSON_SESSION_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PLAN_STORAGE_EVENT, sync);
      window.removeEventListener(PERSON_SESSION_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Immersive tracking — no chrome on phones/desktop track session
  if (pathname?.startsWith("/track")) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--fit-border)] bg-[var(--fit-surface)]/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          href={ROUTES.home}
          className="shrink-0 font-display text-base font-semibold tracking-tight text-[var(--fit-ink)]"
        >
          {APP_NAME}
        </Link>

        {/* Desktop / tablet links */}
        <nav className="hidden items-center gap-1 sm:flex sm:gap-2">
          <Link
            className={`${linkClass} rounded-full px-3 py-1.5 hover:bg-[var(--fit-accent-soft)]`}
            href={ROUTES.generate}
          >
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
          <Link
            className={`${linkClass} rounded-full px-3 py-1.5 hover:bg-[var(--fit-accent-soft)]`}
            href={ROUTES.exercises}
          >
            Exercises
          </Link>
          {goalLabel ? (
            <span className="hidden rounded-full bg-[var(--fit-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--fit-accent)] md:inline">
              Becoming {goalLabel.toLowerCase()}
            </span>
          ) : null}
          <Link
            href={ROUTES.generate}
            className="ml-1 rounded-full bg-[var(--fit-accent)] px-3.5 py-1.5 text-xs font-semibold text-white"
          >
            Get started
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[var(--fit-border)] px-3 text-xs font-semibold text-[var(--fit-ink)] sm:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen ? (
        <nav className="border-t border-[var(--fit-border)] bg-[var(--fit-surface)] px-4 py-3 sm:hidden">
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href={ROUTES.generate}
                className="block rounded-xl px-3 py-3 text-sm font-semibold text-[var(--fit-ink)] hover:bg-[var(--fit-accent-soft)]"
              >
                Assessment
              </Link>
            </li>
            {planId ? (
              <li>
                <Link
                  href={planPath(planId)}
                  className="block rounded-xl px-3 py-3 text-sm font-semibold text-[var(--fit-ink)] hover:bg-[var(--fit-accent-soft)]"
                >
                  My Plan
                </Link>
              </li>
            ) : null}
            <li>
              <Link
                href={ROUTES.exercises}
                className="block rounded-xl px-3 py-3 text-sm font-semibold text-[var(--fit-ink)] hover:bg-[var(--fit-accent-soft)]"
              >
                Exercises
              </Link>
            </li>
            <li>
              <Link
                href={ROUTES.generate}
                className="mt-1 block rounded-xl bg-[var(--fit-accent)] px-3 py-3 text-center text-sm font-semibold text-white"
              >
                Get started
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
