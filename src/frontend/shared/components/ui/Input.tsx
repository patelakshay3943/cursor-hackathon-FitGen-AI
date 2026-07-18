import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-2xl border border-[var(--fit-border)] bg-[var(--fit-surface)] px-3.5 py-2.5 text-sm text-[var(--fit-ink)] outline-none transition placeholder:text-[var(--fit-muted)]/70 focus:border-[var(--fit-accent)] focus:ring-2 focus:ring-[var(--fit-accent)]/25 ${className}`}
      {...props}
    />
  );
}
