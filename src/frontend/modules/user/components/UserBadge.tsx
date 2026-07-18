"use client";

import { useAppSelector } from "@/store/hooks";

export function UserBadge() {
  const { isAuthenticated, displayName, email } = useAppSelector((s) => s.auth);

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Not signed in — use <span className="font-medium">Log in</span> for a static
        session.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="font-medium text-zinc-900 dark:text-zinc-50">{displayName}</p>
      <p className="text-zinc-600 dark:text-zinc-400">{email}</p>
    </div>
  );
}
