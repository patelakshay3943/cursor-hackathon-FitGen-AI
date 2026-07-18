import type { WelcomeResponse } from "@/backend/types";
import { ROUTES } from "@/shared/constants";

export async function fetchWelcome(): Promise<WelcomeResponse> {
  const res = await fetch(ROUTES.api.welcome);

  if (!res.ok) {
    throw new Error("Failed to load welcome message");
  }

  return res.json() as Promise<WelcomeResponse>;
}
