import type { UserProfile } from "@/modules/plan/types";
import type { SessionStats } from "../hooks/useExerciseSession";
import { getTotalReps, isEarlyQuitSession } from "./sessionOutcome";
import {
  DEFAULT_AFFIRMATION,
  getEarlyQuitEncouragement,
  getFocusLine,
  getGoalAffirmation,
  getKeepGoingLine,
  getMotivationLine,
} from "./affirmations";

export type PreWorkoutAffirmation = {
  becoming: string;
  preLine: string;
  focusLine: string | null;
  motivationLine: string | null;
  encouragementLine: string;
  workoutNumber: number;
};

export type PostWorkoutAppreciation = {
  title: string;
  message: string;
  encouragement: string;
  footer: string;
  milestone: string | null;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildEarlyQuitAppreciation(
  profile: UserProfile | null,
  stats: SessionStats,
  showUpCount: number,
): PostWorkoutAppreciation {
  const goal = getGoalAffirmation(profile);
  const motivation = getMotivationLine(profile);
  const parts: string[] = [
    "Not every session ends in reps — and that's okay.",
    "You opened the workout, stepped in, and gave yourself a chance. That still counts.",
  ];

  if (stats.elapsedSec >= 30) {
    parts.push(
      `You stayed with it for ${formatTime(stats.elapsedSec)} — setup, camera, nerves. That's part of the journey too.`,
    );
  } else if (stats.elapsedSec >= 5) {
    parts.push(
      "You looked at the workout and chose to pause. You're allowed to do that.",
    );
  } else {
    parts.push(
      "Even a quick try is better than never starting. You didn't fail — you paused.",
    );
  }

  if (motivation) {
    parts.push(
      `You said "${motivation}" — that reason is still yours whenever you're ready to try again.`,
    );
  }

  let milestone: string | null =
    "Zero reps today doesn't erase your effort to show up.";
  let footer = "No pressure — when you're ready, tap Train again.";

  if (showUpCount === 1) {
    milestone =
      "Opening your first workout takes courage — even if you walk away at zero.";
    footer = "You started. Come back when it feels right.";
  }

  return {
    title: `You're Still Becoming ${goal.becoming}`,
    message: parts.join(" "),
    encouragement: getEarlyQuitEncouragement(showUpCount + stats.elapsedSec),
    footer,
    milestone,
  };
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
    encouragementLine: getKeepGoingLine(showUpCount),
    workoutNumber: showUpCount + 1,
  };
}

export function buildPostWorkoutAppreciation(
  profile: UserProfile | null,
  stats: SessionStats,
  showUpCount: number,
): PostWorkoutAppreciation {
  if (isEarlyQuitSession(stats)) {
    return buildEarlyQuitAppreciation(profile, stats, showUpCount);
  }

  const goal = getGoalAffirmation(profile);
  const motivation = getMotivationLine(profile);
  const totalReps = getTotalReps(stats);
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
    parts.push(
      "Your form is still finding its groove — and that's okay. You're doing fine.",
    );
  }

  const encouragement = getKeepGoingLine(showUpCount + totalReps);

  let footer = "Keep going — you're on the path.";
  let milestone: string | null = null;

  if (showUpCount === 1) {
    milestone = "This is your first finish today — that first step is the bravest one.";
    footer = "You started. That's everything.";
  } else if (showUpCount === 3) {
    milestone = "Three workouts in one session — most people stop at one. You didn't.";
    footer = "You're building a rhythm most people only talk about.";
  } else if (showUpCount >= 2) {
    footer = `Workout #${showUpCount} this session — you're building a rhythm.`;
  }

  return {
    title: `You Are Becoming ${goal.becoming}`,
    message: parts.join(" "),
    encouragement,
    footer,
    milestone,
  };
}

export function defaultPostWorkoutAppreciation(
  stats: SessionStats,
  showUpCount: number,
): PostWorkoutAppreciation {
  return buildPostWorkoutAppreciation(null, stats, showUpCount);
}

export { DEFAULT_AFFIRMATION, getGoalAffirmation };
