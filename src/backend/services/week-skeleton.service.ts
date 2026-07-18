import type { PlanSkeleton, SkeletonDay, UserProfile } from "@/backend/types/plan.types";
import { getSplitForProfile } from "./split-template.service";

const TOTAL_DAYS = 28;

export function buildWeekSkeleton(profile: UserProfile): PlanSkeleton {
  const { splitType, weekPattern } = getSplitForProfile(profile);
  const days: SkeletonDay[] = [];

  for (let dayNumber = 1; dayNumber <= TOTAL_DAYS; dayNumber += 1) {
    const weekNumber = Math.ceil(dayNumber / 7);
    const pattern = weekPattern[(dayNumber - 1) % 7];
    days.push({
      dayNumber,
      weekNumber,
      focus: pattern.focus,
      isRestDay: pattern.isRestDay,
      label: `Day ${dayNumber} — ${pattern.focus}`,
    });
  }

  return { splitType, days };
}

export { TOTAL_DAYS };
