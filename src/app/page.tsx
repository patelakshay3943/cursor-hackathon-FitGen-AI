import Link from "next/link";
import { APP_NAME } from "@/config/app";
import { ROUTES } from "@/shared/constants";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-16 pt-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--fit-border)] bg-[var(--fit-surface)] px-6 py-14 sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,122,95,0.18) 0%, transparent 42%), linear-gradient(225deg, rgba(196,92,38,0.12) 0%, transparent 40%)",
          }}
        />
        <div className="relative max-w-xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fit-accent)]">
            AI personal trainer
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-[var(--fit-ink)] sm:text-6xl">
            {APP_NAME}
          </h1>
          <p className="text-base leading-relaxed text-[var(--fit-muted)] sm:text-lg">
            Answer a short assessment. We filter 800+ exercises from our database, then OpenAI
            builds Day 1 of your 28-day plan — unlock the next day when you finish.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={ROUTES.generate}
              className="inline-flex items-center justify-center rounded-full bg-[var(--fit-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--fit-accent-hover)]"
            >
              Start assessment
            </Link>
            <Link
              href={ROUTES.exercises}
              className="inline-flex items-center justify-center rounded-full border border-[var(--fit-border)] bg-[var(--fit-surface)] px-6 py-3 text-sm font-semibold text-[var(--fit-ink)] transition hover:border-[var(--fit-accent)]"
            >
              Browse exercises
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Smart assessment",
            body: "Goal, schedule, limitations, and gear — so every workout fits your life.",
          },
          {
            title: "AI + real database",
            body: "OpenAI only picks from your seeded exercise library — no invented moves.",
          },
          {
            title: "Day-by-day unlock",
            body: "See Day 1 now. Complete it to generate and unlock Day 2, through 4 weeks.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-surface)] p-5"
          >
            <h2 className="font-display text-lg font-semibold text-[var(--fit-ink)]">
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--fit-muted)]">{card.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
