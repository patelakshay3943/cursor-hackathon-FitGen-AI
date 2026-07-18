import type { UserProfile } from "@/modules/plan/types";
import type { SessionStats } from "../hooks/useExerciseSession";
import {
  DEFAULT_AFFIRMATION,
  getFocusLine,
  getGoalAffirmation,
  getMotivationLine,
} from "./affirmations";

export type PreWorkoutAffirmation = {
  becoming: string;
  preLine: string;
  focusLine: string | null;
  motivationLine: string | null;
  workoutNumber: number;
};

export type PostWorkoutAppreciation = {
  title: string;
  message: string;
  footer: string;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function buildPreWorkoutAffirmation(
  profile: UserProfile | null,
  showUpCount: number,
): PreWorkoutAffirmation {
  const goal = getGoalAffirmation(profile);
  return {
    becoming: goal.becoming,
    preLine: goal.preLine,
    focusLine: getFocusLine(profile),
    motivationLine: getMotivationLine(profile),
    workoutNumber: showUpCount + 1,
  };
}

export function buildPostWorkoutAppreciation(
  profile: UserProfile | null,
  stats: SessionStats,
  showUpCount: number,
): PostWorkoutAppreciation {
  const goal = getGoalAffirmation(profile);
  const motivation = getMotivationLine(profile);
  const totalReps =
    stats.totalReps || stats.setsCompleted * stats.targetReps + stats.reps;
  const targetVolume = stats.targetSets * stats.targetReps;
  const volumePct =
    targetVolume > 0 ? Math.round((totalReps / targetVolume) * 100) : 0;

  const parts: string[] = [goal.postCore];

  if (motivation) {
    parts.push(`You said "${motivation}" — today you took another step toward that.`);
  }

  if (stats.elapsedSec >= 60 && totalReps > 0) {
    parts.push(
      `You stayed with it for ${formatTime(stats.elapsedSec)} and gave your body ${totalReps} rep${totalReps === 1 ? "" : "s"} of real effort.`,
    );
  } else if (totalReps > 0) {
    parts.push(
      `You logged ${totalReps} rep${totalReps === 1 ? "" : "s"} — your body felt that work.`,
    );
  } else if (stats.elapsedSec >= 30) {
    parts.push(
      `You stayed present for ${formatTime(stats.elapsedSec)} — showing up is the win.`,
    );
  } else {
    parts.push("You stepped in and gave what you had — that still counts.");
  }

  if (volumePct >= 80 && totalReps > 0) {
    parts.push("You gave your body what it needed today. Well done.");
  } else if (totalReps > 0 && stats.formScore < 60) {
    parts.push("Progress isn't always perfect — showing up is how you grow.");
  }

  let footer = "Keep going — you're on the path.";
  if (showUpCount >= 2) {
    footer = `Workout #${showUpCount} this session — you're building a rhythm.`;
  } else if (showUpCount === 1) {
    footer = "First workout done this session — great start.";
  }

  return {
    title: `You Are Becoming ${goal.becoming}`,
    message: parts.join(" "),
    footer,
  };
}

export function defaultPostWorkoutAppreciation(
  stats: SessionStats,
  showUpCount: number,
): PostWorkoutAppreciation {
  return buildPostWorkoutAppreciation(null, stats, showUpCount);
}

export { DEFAULT_AFFIRMATION, getGoalAffirmation };
