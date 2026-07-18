import { PlanGenerator } from "@/modules/plan";

export default function GeneratePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fit-accent)]">
          Fitness assessment
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--fit-ink)]">
          Build your 28-day plan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fit-muted)]">
          Five quick steps. Then OpenAI generates Day 1 from exercises that match your profile in
          our database.
        </p>
      </div>
      <div className="rounded-[1.5rem] border border-[var(--fit-border)] bg-[var(--fit-surface)] p-5 sm:p-7">
        <PlanGenerator />
      </div>
    </main>
  );
}
