"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/shared/components/ui/Button";
import { Label } from "@/shared/components/ui/Label";
import type {
  AgeRange,
  DaysPerWeek,
  Goal,
  Level,
  SessionMinutes,
  Sex,
  TrainingLocation,
  UserProfile,
} from "../types";
import {
  ASSESSMENT_STEPS,
  EQUIPMENT_OPTIONS,
  FOCUS_OPTIONS,
  GOAL_OPTIONS,
  LEVEL_OPTIONS,
  LIMITATION_OPTIONS,
} from "../types";

type ProfileFormProps = {
  onSubmit: (profile: UserProfile) => unknown;
  loading?: boolean;
};

const defaultProfile: UserProfile = {
  goal: "muscle_gain",
  level: "beginner",
  daysPerWeek: 4,
  equipment: ["dumbbell", "bodyweight"],
  sessionMinutes: 45,
  ageRange: "25-34",
  sex: "prefer_not",
  trainingLocation: "gym",
  limitations: ["none"],
  focusAreas: ["full"],
  motivation: "",
};

function OptionCard({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-h-[3.25rem] touch-manipulation rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
        selected
          ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] shadow-sm ring-2 ring-[var(--fit-accent)]/30"
          : "border-[var(--fit-border)] bg-[var(--fit-surface)] hover:border-[var(--fit-accent)]/40"
      }`}
    >
      <span className="block text-sm font-semibold text-[var(--fit-ink)]">{title}</span>
      {description ? (
        <span className="mt-1 block text-xs leading-relaxed text-[var(--fit-muted)]">
          {description}
        </span>
      ) : null}
      {selected ? (
        <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-[var(--fit-accent)]">
          Selected
        </span>
      ) : null}
    </button>
  );
}

export function ProfileForm({ onSubmit, loading }: ProfileFormProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<Goal>(defaultProfile.goal);
  const [level, setLevel] = useState<Level>(defaultProfile.level);
  const [daysPerWeek, setDaysPerWeek] = useState<DaysPerWeek>(defaultProfile.daysPerWeek);
  const [sessionMinutes, setSessionMinutes] = useState<SessionMinutes>(
    defaultProfile.sessionMinutes,
  );
  const [equipment, setEquipment] = useState<string[]>(defaultProfile.equipment);
  const [ageRange, setAgeRange] = useState<AgeRange>(defaultProfile.ageRange ?? "25-34");
  const [sex, setSex] = useState<Sex>(defaultProfile.sex ?? "prefer_not");
  const [trainingLocation, setTrainingLocation] = useState<TrainingLocation>(
    defaultProfile.trainingLocation ?? "gym",
  );
  const [limitations, setLimitations] = useState<string[]>(defaultProfile.limitations);
  const [focusAreas, setFocusAreas] = useState<string[]>(defaultProfile.focusAreas);
  const [motivation, setMotivation] = useState("");

  function toggleEquipment(value: string) {
    setEquipment((prev) => {
      if (value === "full gym") {
        return prev.includes("full gym") ? [] : ["full gym"];
      }
      const withoutFull = prev.filter((e) => e !== "full gym");
      return withoutFull.includes(value)
        ? withoutFull.filter((e) => e !== value)
        : [...withoutFull, value];
    });
  }

  function toggleLimitation(value: string) {
    setLimitations((prev) => {
      if (value === "none") return ["none"];
      const withoutNone = prev.filter((v) => v !== "none");
      return withoutNone.includes(value)
        ? withoutNone.filter((v) => v !== value)
        : [...withoutNone, value];
    });
  }

  function toggleFocus(value: string) {
    setFocusAreas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function canContinue(): boolean {
    if (step === 1) return Boolean(goal);
    if (step === 2) return Boolean(daysPerWeek && sessionMinutes);
    if (step === 3) return Boolean(level);
    if (step === 4) return equipment.length > 0;
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < 5) {
      if (!canContinue()) return;
      setStep((s) => s + 1);
      return;
    }
    if (equipment.length === 0) return;
    await onSubmit({
      goal,
      level,
      daysPerWeek,
      equipment,
      sessionMinutes,
      ageRange,
      sex,
      trainingLocation,
      limitations: limitations.length ? limitations : ["none"],
      focusAreas: focusAreas.length ? focusAreas : ["full"],
      motivation: motivation.trim() || undefined,
    });
  }

  const current = ASSESSMENT_STEPS[step - 1];
  const progress = (step / ASSESSMENT_STEPS.length) * 100;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--fit-muted)]">
          <span>
            Step {step} of {ASSESSMENT_STEPS.length}
          </span>
          <span>{current.title}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--fit-border)]">
          <div
            className="h-full rounded-full bg-[var(--fit-accent)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <h2 className="mt-4 font-display text-2xl text-[var(--fit-ink)]">
          {current.subtitle}
        </h2>
      </div>

      {step === 1 ? (
        <fieldset key="s1" className="grid gap-3 sm:grid-cols-2 fit-fade-up">
          {GOAL_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={goal === opt.value}
              title={opt.label}
              description={opt.description}
              onSelect={() => setGoal(opt.value)}
            />
          ))}
        </fieldset>
      ) : null}

      {step === 2 ? (
        <div key="s2" className="space-y-6 fit-fade-up">
          <fieldset className="space-y-3">
            <Label>Training days per week</Label>
            <div className="grid grid-cols-4 gap-2">
              {([3, 4, 5, 6] as DaysPerWeek[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysPerWeek(d)}
                  className={`min-h-12 touch-manipulation rounded-2xl border py-4 text-center transition active:scale-[0.98] ${
                    daysPerWeek === d
                      ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] ring-2 ring-[var(--fit-accent)]/30"
                      : "border-[var(--fit-border)] bg-[var(--fit-surface)]"
                  }`}
                >
                  <span className="block text-xl font-semibold text-[var(--fit-ink)]">{d}</span>
                  <span className="text-xs text-[var(--fit-muted)]">days</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--fit-muted)]">
              {daysPerWeek <= 3
                ? "Full-body sessions work best at 3 days."
                : daysPerWeek === 4
                  ? "Upper/Lower split keeps recovery solid."
                  : "Push / Pull / Legs style programming."}
            </p>
          </fieldset>

          <fieldset className="space-y-3">
            <Label>Session length</Label>
            <div className="grid grid-cols-3 gap-2">
              {([30, 45, 60] as SessionMinutes[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSessionMinutes(m)}
                  className={`min-h-12 touch-manipulation rounded-2xl border py-3 text-sm font-medium transition active:scale-[0.98] ${
                    sessionMinutes === m
                      ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] text-[var(--fit-ink)] ring-2 ring-[var(--fit-accent)]/30"
                      : "border-[var(--fit-border)] bg-[var(--fit-surface)] text-[var(--fit-muted)]"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      {step === 3 ? (
        <div key="s3" className="space-y-6 fit-fade-up">
          <fieldset className="grid gap-3">
            <Label>Experience level</Label>
            {LEVEL_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                selected={level === opt.value}
                title={opt.label}
                description={opt.description}
                onSelect={() => setLevel(opt.value)}
              />
            ))}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="space-y-2">
              <Label>Age range</Label>
              <div className="flex flex-wrap gap-2">
                {(["18-24", "25-34", "35-44", "45+"] as AgeRange[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAgeRange(a)}
                    className={`min-h-10 touch-manipulation rounded-full border px-3 py-2 text-xs ${
                      ageRange === a
                        ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] ring-2 ring-[var(--fit-accent)]/25"
                        : "border-[var(--fit-border)]"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Sex (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["male", "Male"],
                    ["female", "Female"],
                    ["prefer_not", "Prefer not"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSex(value)}
                    className={`min-h-10 touch-manipulation rounded-full border px-3 py-2 text-xs ${
                      sex === value
                        ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] ring-2 ring-[var(--fit-accent)]/25"
                        : "border-[var(--fit-border)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <fieldset className="space-y-2">
            <Label>Injuries or limitations</Label>
            <div className="flex flex-wrap gap-2">
              {LIMITATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleLimitation(opt.value)}
                  className={`min-h-10 touch-manipulation rounded-full border px-3 py-2 text-xs ${
                    limitations.includes(opt.value)
                      ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] ring-2 ring-[var(--fit-accent)]/25"
                      : "border-[var(--fit-border)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Priority focus areas</Label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleFocus(opt.value)}
                  className={`min-h-10 touch-manipulation rounded-full border px-3 py-2 text-xs ${
                    focusAreas.includes(opt.value)
                      ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] ring-2 ring-[var(--fit-accent)]/25"
                      : "border-[var(--fit-border)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      {step === 4 ? (
        <div key="s4" className="space-y-6 fit-fade-up">
          <fieldset className="space-y-2">
            <Label>Where do you train?</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["home", "Home"],
                  ["gym", "Gym"],
                  ["both", "Both"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTrainingLocation(value)}
                  className={`min-h-12 touch-manipulation rounded-2xl border py-3 text-sm font-medium active:scale-[0.98] ${
                    trainingLocation === value
                      ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] ring-2 ring-[var(--fit-accent)]/30"
                      : "border-[var(--fit-border)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Available equipment</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleEquipment(opt.value)}
                  className={`min-h-14 touch-manipulation rounded-2xl border px-4 py-3 text-left active:scale-[0.98] ${
                    equipment.includes(opt.value)
                      ? "border-[var(--fit-accent)] bg-[var(--fit-accent-soft)] ring-2 ring-[var(--fit-accent)]/30"
                      : "border-[var(--fit-border)] bg-[var(--fit-surface)]"
                  }`}
                >
                  <span className="block text-sm font-medium text-[var(--fit-ink)]">
                    {opt.label}
                  </span>
                  <span className="text-xs text-[var(--fit-muted)]">{opt.hint}</span>
                </button>
              ))}
            </div>
            {equipment.length === 0 ? (
              <p className="text-xs text-red-600">Select at least one equipment option.</p>
            ) : null}
          </fieldset>

          <fieldset className="space-y-2">
            <Label htmlFor="motivation">Anything else for your coach? (optional)</Label>
            <textarea
              id="motivation"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value.slice(0, 200))}
              rows={3}
              placeholder="e.g. Prefer short workouts before work, avoid jumping…"
              className="w-full rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-surface)] px-3 py-2 text-sm text-[var(--fit-ink)] outline-none ring-[var(--fit-accent)] focus:ring-2"
            />
          </fieldset>
        </div>
      ) : null}

      {step === 5 ? (
        <div key="s5" className="space-y-4 rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-surface)] p-5 fit-fade-up">
          <p className="text-sm text-[var(--fit-muted)]">
            AI will build a 28-day plan and generate <strong>Day 1</strong> using exercises from
            your database that match this profile.
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Goal", GOAL_OPTIONS.find((g) => g.value === goal)?.label],
              ["Level", LEVEL_OPTIONS.find((l) => l.value === level)?.label],
              ["Schedule", `${daysPerWeek} days · ${sessionMinutes} min`],
              ["Location", trainingLocation],
              ["Age", ageRange],
              ["Limitations", limitations.join(", ")],
              ["Focus", focusAreas.join(", ")],
              ["Equipment", equipment.join(", ")],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="text-xs uppercase tracking-wide text-[var(--fit-muted)]">{k}</dt>
                <dd className="mt-0.5 font-medium capitalize text-[var(--fit-ink)]">{v}</dd>
              </div>
            ))}
          </dl>
          {motivation ? (
            <p className="rounded-xl bg-[var(--fit-bg)] px-3 py-2 text-sm text-[var(--fit-muted)]">
              “{motivation}”
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={loading || !canContinue()}
          className="min-w-[160px] bg-[var(--fit-accent)] text-white hover:bg-[var(--fit-accent-hover)] dark:bg-[var(--fit-accent)] dark:text-white dark:hover:bg-[var(--fit-accent-hover)]"
        >
          {loading
            ? "AI generating Day 1…"
            : step < 5
              ? "Continue"
              : "Generate with AI"}
        </Button>
      </div>
    </form>
  );
}
