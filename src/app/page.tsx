import Link from "next/link";
import { APP_NAME } from "@/config/app";
import { ROUTES } from "@/shared/constants";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-20 pt-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--fit-border)] bg-[var(--fit-surface)] px-6 py-14 sm:px-12 sm:py-20 fit-fade-up">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,122,95,0.2) 0%, transparent 45%), linear-gradient(225deg, rgba(196,92,38,0.14) 0%, transparent 42%)",
          }}
        />
        <div
          className="pointer-events-none absolute -right-8 top-8 hidden h-56 w-56 rounded-full border border-[var(--fit-accent)]/20 sm:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-2 top-20 hidden h-40 w-40 rounded-full bg-[var(--fit-accent)]/10 sm:block"
          aria-hidden
        />

        <div className="relative max-w-xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--fit-accent)]">
            Your AI training partner
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--fit-ink)] sm:text-6xl">
            {APP_NAME}
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-[var(--fit-muted)] sm:text-lg">
            A short assessment. Exercises from our database. OpenAI builds Day 1 — unlock each
            next day as you train.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={ROUTES.generate}
              className="inline-flex items-center justify-center rounded-full bg-[var(--fit-accent)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[var(--fit-accent)]/25 transition hover:bg-[var(--fit-accent-hover)]"
            >
              Start free assessment
            </Link>
            <Link
              href={ROUTES.exercises}
              className="inline-flex items-center justify-center rounded-full border border-[var(--fit-border)] bg-[var(--fit-surface)] px-6 py-3 text-sm font-semibold text-[var(--fit-ink)] transition hover:border-[var(--fit-accent)]"
            >
              Explore exercises
            </Link>
          </div>
          <p className="text-xs text-[var(--fit-muted)]">No account needed · ~2 minutes to Day 1</p>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { step: "01", title: "Assess", body: "Goal, schedule, gear, and any limitations." },
          { step: "02", title: "Generate", body: "AI picks real exercises from our database." },
          { step: "03", title: "Train daily", body: "Finish a day to unlock tomorrow’s workout." },
        ].map((item, i) => (
          <div
            key={item.step}
            className={`rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-surface)] p-5 fit-fade-up fit-delay-${i + 1}`}
          >
            <p className="text-xs font-semibold tracking-widest text-[var(--fit-accent)]">
              {item.step}
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold text-[var(--fit-ink)]">
              {item.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--fit-muted)]">{item.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
