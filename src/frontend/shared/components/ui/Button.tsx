import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variantClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--fit-accent)] text-white hover:bg-[var(--fit-accent-hover)] shadow-sm shadow-[var(--fit-accent)]/20",
  secondary:
    "border border-[var(--fit-border)] bg-[var(--fit-surface)] text-[var(--fit-ink)] hover:border-[var(--fit-accent)]/50",
  ghost: "text-[var(--fit-muted)] hover:bg-[var(--fit-accent-soft)] hover:text-[var(--fit-ink)]",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}
