/**
 * Import English exercises from wger (CC-BY-SA) and merge into the Exercise table.
 * Skips names that already exist (case-insensitive) to avoid duplicates.
 *
 * Usage: npx tsx prisma/import-wger.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  buildTags,
  inferForce,
  inferMechanic,
  inferMuscleGroup,
  mapWgerEquipment,
  mapWgerMuscle,
  popularityScore,
  slugifyId,
  stripHtml,
  WGER_CATEGORY_MAP,
} from "./exercise-enrichment";

const prisma = new PrismaClient();

type WgerMuscle = { name: string; name_en: string };
type WgerEquipment = { name: string };
type WgerImage = { image: string; is_main?: boolean; thumbnails?: { medium?: string } };
type WgerTranslation = { language: number; name: string; description: string };
type WgerExercise = {
  id: number;
  uuid: string;
  category?: { name: string };
  muscles?: WgerMuscle[];
  muscles_secondary?: WgerMuscle[];
  equipment?: WgerEquipment[];
  images?: WgerImage[];
  translations?: WgerTranslation[];
};

async function fetchAllEnglish(): Promise<WgerExercise[]> {
  const collected: WgerExercise[] = [];
  let url: string | null =
    "https://wger.de/api/v2/exerciseinfo/?language=2&limit=50";

  while (url) {
    console.log(`Fetching ${url}`);
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`wger fetch failed: ${res.status}`);
    const data = (await res.json()) as {
      next: string | null;
      results: WgerExercise[];
    };
    collected.push(...data.results);
    url = data.next;
    // Be polite to the public API
    await new Promise((r) => setTimeout(r, 120));
  }

  return collected;
}

function pickEnglishTranslation(ex: WgerExercise): WgerTranslation | null {
  const translations = ex.translations ?? [];
  // language 2 = English in wger
  return (
    translations.find((t) => Number(t.language) === 2) ||
    translations.find((t) => t.name && /[a-zA-Z]/.test(t.name)) ||
    null
  );
}

async function main() {
  console.log("Importing exercises from wger.de …");
  const remote = await fetchAllEnglish();
  console.log(`Fetched ${remote.length} exerciseinfo rows`);

  let imported = 0;
  let skipped = 0;
  let updated = 0;

  for (const item of remote) {
    const tr = pickEnglishTranslation(item);
    if (!tr?.name?.trim()) {
      skipped += 1;
      continue;
    }

    const name = tr.name.trim();
    const existing = await prisma.exercise.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    const primaryMuscles = (item.muscles ?? [])
      .map((m) => mapWgerMuscle(m.name_en, m.name))
      .filter(Boolean);
    const secondaryMuscles = (item.muscles_secondary ?? [])
      .map((m) => mapWgerMuscle(m.name_en, m.name))
      .filter(Boolean);

    const equipments = (item.equipment ?? []).map((e) => mapWgerEquipment(e.name));
    const equipment = equipments.find((e) => e) ?? "body only";

    const categoryRaw = (item.category?.name || "strength").toLowerCase();
    const category = WGER_CATEGORY_MAP[categoryRaw] ?? "strength";

    const instructions = stripHtml(tr.description || "");
    const images = (item.images ?? [])
      .map((img) => img.thumbnails?.medium || img.image)
      .filter(Boolean);

    // Prefer bodyweight / strength beginner defaults when unknown
    const level =
      equipment === "body only" || category === "cardio" ? "beginner" : "intermediate";

    const force = inferForce(name, primaryMuscles, category);
    const mechanic = inferMechanic(name, category);
    const muscleGroup = inferMuscleGroup(primaryMuscles);
    const tags = buildTags({
      force,
      mechanic,
      equipment,
      category,
      level,
      primaryMuscles,
    });
    tags.push("wger");
    const popularity = popularityScore({
      category,
      mechanic,
      level,
      hasImages: images.length > 0,
      hasInstructions: instructions.length > 0,
    });

    const id = existing?.id ?? slugifyId(name, "wger_");

    const payload = {
      name,
      force,
      level,
      mechanic,
      equipment,
      category,
      primaryMuscles,
      secondaryMuscles,
      instructions:
        instructions.length > 0
          ? instructions
          : [`Perform ${name} with controlled form for the prescribed reps.`],
      images,
      muscleGroup,
      aliases: [name, `wger-${item.id}`],
      tags,
      source: existing?.source === "free-exercise-db" ? "free-exercise-db" : "wger",
      popularity: existing
        ? Math.max(existing.popularity, popularity)
        : popularity,
    };

    if (existing) {
      // Enrich existing free-exercise-db row with wger images/instructions if missing
      const existingImages = (existing.images as string[]) ?? [];
      const existingInstructions = (existing.instructions as string[]) ?? [];
      await prisma.exercise.update({
        where: { id: existing.id },
        data: {
          images: existingImages.length ? existingImages : images,
          instructions: existingInstructions.length ? existingInstructions : payload.instructions,
          force: existing.force ?? force,
          mechanic: existing.mechanic ?? mechanic,
          equipment: existing.equipment ?? equipment,
          muscleGroup: existing.muscleGroup ?? muscleGroup,
          tags: Array.from(
            new Set([
              ...(((existing.tags as string[]) ?? []) as string[]),
              ...tags.filter((t) => t !== "wger"),
            ]),
          ),
          popularity: payload.popularity,
        },
      });
      updated += 1;
    } else {
      await prisma.exercise.create({
        data: {
          id,
          ...payload,
          source: "wger",
        },
      });
      imported += 1;
    }
  }

  const total = await prisma.exercise.count();
  const bySource = await prisma.exercise.groupBy({
    by: ["source"],
    _count: true,
  });

  console.log(`\nImport finished.`);
  console.log(`  new from wger: ${imported}`);
  console.log(`  enriched existing: ${updated}`);
  console.log(`  skipped (no EN name): ${skipped}`);
  console.log(`  total exercises now: ${total}`);
  console.log(
    "  by source:",
    bySource.map((s) => `${s.source}=${s._count}`).join(", "),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
