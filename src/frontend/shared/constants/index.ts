export const ROUTES = {
  home: "/",
  generate: "/generate",
  plan: "/plan",
  exercises: "/exercises",
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
