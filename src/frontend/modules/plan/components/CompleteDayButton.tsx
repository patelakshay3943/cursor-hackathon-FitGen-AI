"use client";

import { Button } from "@/shared/components/ui/Button";

type CompleteDayButtonProps = {
  dayNumber: number;
  onComplete: () => unknown;
  loading?: boolean;
  disabled?: boolean;
  isLastDay?: boolean;
};

export function CompleteDayButton({
  dayNumber,
  onComplete,
  loading,
  disabled,
  isLastDay,
}: CompleteDayButtonProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--fit-muted)]">
        {isLastDay
          ? "Finish your final day to complete the 28-day plan."
          : "Mark complete to unlock the next day — AI will build it from your exercise DB."}
      </p>
      <Button
        type="button"
        onClick={() => void onComplete()}
        disabled={disabled || loading}
        className="w-full shrink-0 bg-[var(--fit-accent)] text-white hover:bg-[var(--fit-accent-hover)] sm:w-auto dark:bg-[var(--fit-accent)] dark:text-white dark:hover:bg-[var(--fit-accent-hover)]"
      >
        {loading
          ? "Generating next day…"
          : isLastDay
            ? `Complete Day ${dayNumber}`
            : `Complete Day ${dayNumber} & unlock next`}
      </Button>
    </div>
  );
}
