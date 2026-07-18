"use client";

import { useEffect, useState } from "react";
import type { WelcomeResponse } from "@/backend/types";
import { fetchWelcome } from "@/frontend/api/welcome";

export function WelcomeBanner() {
  const [welcome, setWelcome] = useState<WelcomeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWelcome()
      .then(setWelcome)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <p className="mt-3 text-sm text-red-600 dark:text-red-400">
        API error: {error}
      </p>
    );
  }

  if (!welcome) {
    return (
      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        Loading welcome message…
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
        {welcome.message}
      </p>
      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
        API: <code className="rounded bg-emerald-100 px-1 dark:bg-emerald-900">GET /api/welcome</code>
        {" · "}
        v{welcome.version}
      </p>
    </div>
  );
}
