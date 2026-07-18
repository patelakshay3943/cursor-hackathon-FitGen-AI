import type { SessionStats } from "../hooks/useExerciseSession";

export type SessionReview = {
  strengths: string[];
  improvements: string[];
  headline: string;
};

const WRONG_MOVE_RE =
  /looks like|switch to|instead|push-up|wrong|hang and pull/i;

/** Build post-session coach review from tracked stats. */
export function buildSessionReview(
  stats: SessionStats,
  exerciseName: string,
): SessionReview {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const totalReps =
    stats.totalReps ||
    stats.setsCompleted * stats.targetReps + stats.reps;
  const targetVolume = stats.targetSets * stats.targetReps;
  const volumePct =
    targetVolume > 0 ? Math.round((totalReps / targetVolume) * 100) : 0;

  const uniqueMistakes = [...new Set(stats.mistakes)].slice(0, 5);
  const wrongMoveAlerts = uniqueMistakes.filter((m) => WRONG_MOVE_RE.test(m));
  const hasWrongMove = wrongMoveAlerts.length > 0;

  // Never praise "perfect form" when the session flagged wrong exercises
  if (!hasWrongMove && stats.formScore >= 80) {
    strengths.push(
      `Strong overall form — scored ${stats.formScore}% across the session`,
    );
  } else if (!hasWrongMove && stats.formScore >= 60) {
    strengths.push(
      `Decent control — form held around ${stats.formScore}% for ${exerciseName}`,
    );
  } else if (hasWrongMove && totalReps > 0) {
    strengths.push(
      `Logged ${totalReps} tracked rep${totalReps === 1 ? "" : "s"} — next focus is matching ${exerciseName} cleanly`,
    );
  }

  if (
    !hasWrongMove &&
    totalReps >= Math.max(3, Math.floor(targetVolume * 0.5))
  ) {
    strengths.push(
      `Solid work volume — ${totalReps} rep${totalReps === 1 ? "" : "s"} logged`,
    );
  }

  if (stats.setsCompleted >= 1) {
    strengths.push(
      `Completed ${stats.setsCompleted} full set${stats.setsCompleted === 1 ? "" : "s"}`,
    );
  } else if (totalReps > 0 && stats.targetReps > 0) {
    improvements.push(
      `No full sets yet — you had ${totalReps} reps toward the first set of ${stats.targetReps}`,
    );
  }

  if (stats.elapsedSec >= 60 && stats.formScore >= 55 && !hasWrongMove) {
    strengths.push("Stayed with the session long enough to build a rhythm");
  }

  if (!hasWrongMove && stats.mistakes.length === 0 && stats.formScore >= 70) {
    strengths.push("No major wrong-move alerts — movement matched the exercise");
  }

  for (const m of uniqueMistakes) {
    improvements.push(m);
  }

  if (hasWrongMove) {
    improvements.push(
      `Reps only count when the camera sees ${exerciseName} — reset to the right starting position`,
    );
  }

  if (!hasWrongMove && stats.formScore < 60) {
    improvements.push(
      `Form score was ${stats.formScore}% — slow down and hit full range each rep`,
    );
  } else if (!hasWrongMove && stats.formScore < 75 && uniqueMistakes.length === 0) {
    improvements.push(
      "Tighten setup and lockout consistency to push form above 75%",
    );
  }

  if (volumePct < 70 && targetVolume > 0) {
    improvements.push(
      `Volume short of target (${totalReps}/${targetVolume} reps) — aim for all ${stats.targetSets}×${stats.targetReps} next time`,
    );
  }

  if (strengths.length === 0) {
    strengths.push("You showed up and finished the session — that’s the first win");
  }

  if (improvements.length === 0) {
    improvements.push(
      "Keep the same pattern next session and nudge tempo control on the last reps",
    );
  }

  let headline = "Session wrapped — here’s your coach review";
  if (hasWrongMove) {
    headline = `Session done — camera often saw a different move than ${exerciseName}`;
  } else if (stats.formScore >= 80 && volumePct >= 80) {
    headline = "Strong session — form and volume both looked good";
  } else if (stats.formScore < 55) {
    headline = "Session done — focus next time on matching the exercise cleanly";
  } else if (uniqueMistakes.length >= 2) {
    headline = "Session done — a few form fixes will unlock cleaner reps";
  }

  return { strengths, improvements, headline };
}
