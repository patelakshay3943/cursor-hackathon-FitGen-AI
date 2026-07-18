import Link from "next/link";
import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--fit-border)] bg-[var(--fit-surface)] px-6 py-12 text-center fit-fade-up">
      <p className="font-display text-xl font-semibold text-[var(--fit-ink)]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--fit-muted)]">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="mt-5 inline-block">
          <Button type="button">{actionLabel}</Button>
        </Link>
      ) : null}
    </div>
  );
}
