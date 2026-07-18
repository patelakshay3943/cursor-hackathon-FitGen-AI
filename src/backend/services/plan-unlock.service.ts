import { completePlanDay } from "./plan.service";

/** Thin wrapper kept for plan unlock orchestration naming from the architecture diagram */
export async function unlockNextDay(planId: string, completedDayNumber: number) {
  return completePlanDay(planId, completedDayNumber);
}
