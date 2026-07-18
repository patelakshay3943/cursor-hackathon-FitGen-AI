export const ROUTES = {
  home: "/",
  generate: "/generate",
  plan: "/plan",
  exercises: "/exercises",
  track: "/track",
  login: "/login",
  register: "/register",
  products: "/products",
  orders: "/orders",
  api: {
    welcome: "/api/welcome",
    plansGenerate: "/api/plans/generate",
    exercises: "/api/exercises",
  },
} as const;

export function planPath(id: string) {
  return `/plan/${id}`;
}

export function trackPath(
  exerciseId: string,
  opts?: { name?: string; sets?: number; reps?: string | number; planId?: string },
) {
  const params = new URLSearchParams();
  if (opts?.name) params.set("name", opts.name);
  if (opts?.sets) params.set("sets", String(opts.sets));
  if (opts?.reps) params.set("reps", String(opts.reps));
  if (opts?.planId) params.set("planId", opts.planId);
  const q = params.toString();
  return `/track/${encodeURIComponent(exerciseId)}${q ? `?${q}` : ""}`;
}
