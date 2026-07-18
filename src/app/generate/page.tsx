import { PlanGenerator } from "@/modules/plan";

export default function GeneratePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="fit-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fit-accent)]">
          Fitness assessment
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--fit-ink)]">
          Tell us about your training
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fit-muted)]">
          Five short steps. Then Cursor AI builds Day 1 from exercises that match you in our
          database — usually under a few seconds.
        </p>
      </div>
      <div className="rounded-[1.5rem] border border-[var(--fit-border)] bg-[var(--fit-surface)] p-5 shadow-sm sm:p-7 fit-fade-up fit-delay-1">
        <PlanGenerator />
      </div>
    </main>
  );
}
