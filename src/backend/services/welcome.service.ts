import { APP_NAME, APP_VERSION } from "@/config/app";
import type { WelcomeResponse } from "../types";

export function getWelcomeMessage(): WelcomeResponse {
  return {
    message: `Welcome to ${APP_NAME}! Your fitness journey starts here.`,
    app: APP_NAME,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    status: "ok",
  };
}
