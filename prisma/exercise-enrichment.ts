/** Shared helpers for enriching / normalizing exercise records */

export const MUSCLE_GROUP_MAP: Record<string, string> = {
  chest: "chest",
  lats: "back",
  "middle back": "back",
  "lower back": "back",
  traps: "back",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  abdominals: "core",
  quadriceps: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  adductors: "legs",
  abductors: "legs",
  neck: "other",
};

/** Map wger muscle name_en / name → free-exercise-db style */
export const WGER_MUSCLE_MAP: Record<string, string> = {
  quads: "quadriceps",
  quadriceps: "quadriceps",
  "quadriceps femoris": "quadriceps",
  shoulders: "shoulders",
  "anterior deltoid": "shoulders",
  glutes: "glutes",
  "gluteus maximus": "glutes",
  abs: "abdominals",
  "rectus abdominis": "abdominals",
  "obliquus externus abdominis": "abdominals",
  biceps: "biceps",
  "biceps brachii": "biceps",
  triceps: "triceps",
  "triceps brachii": "triceps",
  chest: "chest",
  "pectoralis major": "chest",
  lats: "lats",
  "latissimus dorsi": "lats",
  calves: "calves",
  "soleus / gastrocnemius": "calves",
  "gastrocnemius": "calves",
  hamstrings: "hamstrings",
  "biceps femoris": "hamstrings",
  traps: "traps",
  "trapezius": "traps",
  forearms: "forearms",
  "brachialis": "biceps",
  "serratus anterior": "chest",
};

export const WGER_EQUIPMENT_MAP: Record<string, string | null> = {
  "none (bodyweight exercise)": "body only",
  bodyweight: "body only",
  barbell: "barbell",
  dumbbell: "dumbbell",
  kettlebell: "kettlebells",
  "swiss ball": "exercise ball",
  "exercise ball": "exercise ball",
  "pull-up bar": "other",
  "sz-bar": "e-z curl bar",
  "ez bar": "e-z curl bar",
  bench: "other",
  incline: "other",
  cable: "cable",
  machine: "machine",
  bands: "bands",
  "resistance band": "bands",
  "medicine ball": "medicine ball",
};

export const WGER_CATEGORY_MAP: Record<string, string> = {
  abs: "strength",
  arms: "strength",
  back: "strength",
  calves: "strength",
  cardio: "cardio",
  chest: "strength",
  legs: "strength",
  shoulders: "strength",
};

export function slugifyId(name: string, prefix = ""): string {
  const base = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
  return `${prefix}${base}`.slice(0, 120);
}

export function inferMuscleGroup(primaryMuscles: string[]): string | null {
  if (!primaryMuscles.length) return null;
  const first = primaryMuscles[0].toLowerCase();
  return MUSCLE_GROUP_MAP[first] ?? "other";
}

export function inferForce(name: string, primary: string[], category: string): string | null {
  const n = name.toLowerCase();
  const muscles = primary.map((m) => m.toLowerCase());
  if (category === "stretching") return "static";
  if (/row|pull|chin|lat|curl|deadlift|shrug/.test(n)) return "pull";
  if (/press|push|fly|dip|squat|lunge|extension|raise/.test(n)) return "push";
  if (muscles.some((m) => ["lats", "middle back", "biceps", "traps"].includes(m))) return "pull";
  if (muscles.some((m) => ["chest", "triceps", "shoulders", "quadriceps"].includes(m))) return "push";
  return null;
}

export function inferMechanic(name: string, category: string): string | null {
  const n = name.toLowerCase();
  if (category === "stretching") return "isolation";
  if (
    /squat|deadlift|bench|row|press|clean|snatch|lunge|pull-up|chin-up|dip|thrust/.test(n)
  ) {
    return "compound";
  }
  if (/curl|extension|raise|fly|kickback|shrug|calf/.test(n)) return "isolation";
  return null;
}

export function inferEquipment(name: string, current: string | null): string | null {
  if (current) return current;
  const n = name.toLowerCase();
  if (/dumbbell|db /.test(n)) return "dumbbell";
  if (/barbell|bb /.test(n)) return "barbell";
  if (/cable|pulley/.test(n)) return "cable";
  if (/kettlebell/.test(n)) return "kettlebells";
  if (/band/.test(n)) return "bands";
  if (/machine|smith/.test(n)) return "machine";
  if (/bodyweight|push-up|pull-up|chin-up|plank|burpee/.test(n)) return "body only";
  return null;
}

export function buildTags(input: {
  force: string | null;
  mechanic: string | null;
  equipment: string | null;
  category: string;
  level: string;
  primaryMuscles: string[];
}): string[] {
  const tags = new Set<string>();
  if (input.force) tags.add(input.force);
  if (input.mechanic) tags.add(input.mechanic);
  if (input.equipment === "body only" || !input.equipment) tags.add("home-friendly");
  if (input.equipment === "dumbbell" || input.equipment === "bands") tags.add("home-friendly");
  if (input.category) tags.add(input.category);
  if (input.level) tags.add(input.level);
  for (const m of input.primaryMuscles.slice(0, 2)) tags.add(m.toLowerCase());
  return [...tags];
}

export function popularityScore(input: {
  category: string;
  mechanic: string | null;
  level: string;
  hasImages: boolean;
  hasInstructions: boolean;
}): number {
  let score = 40;
  if (input.category === "strength") score += 15;
  if (input.mechanic === "compound") score += 15;
  if (input.level === "beginner") score += 5;
  if (input.hasImages) score += 10;
  if (input.hasInstructions) score += 10;
  return Math.min(100, score);
}

export function stripHtml(html: string): string[] {
  const text = html
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 8);
}

export function mapWgerMuscle(nameEn: string, name: string): string {
  const key = (nameEn || name || "").toLowerCase().trim();
  return WGER_MUSCLE_MAP[key] ?? key.replace(/\s+/g, " ");
}

export function mapWgerEquipment(name: string): string | null {
  const key = name.toLowerCase().trim();
  if (key in WGER_EQUIPMENT_MAP) return WGER_EQUIPMENT_MAP[key];
  for (const [k, v] of Object.entries(WGER_EQUIPMENT_MAP)) {
    if (key.includes(k)) return v;
  }
  return "other";
}
