import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  buildTags,
  inferEquipment,
  inferForce,
  inferMechanic,
  inferMuscleGroup,
  popularityScore,
} from "./exercise-enrichment";

const prisma = new PrismaClient();

type RawExercise = {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
};

async function main() {
  const filePath = resolve(process.cwd(), "data/exercises.json");
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as RawExercise[];

  console.log(`Enriching + seeding ${raw.length} free-exercise-db exercises...`);

  const batchSize = 40;
  for (let i = 0; i < raw.length; i += batchSize) {
    const batch = raw.slice(i, i + batchSize);
    await Promise.all(
      batch.map((ex) => {
        const primaryMuscles = ex.primaryMuscles ?? [];
        const secondaryMuscles = ex.secondaryMuscles ?? [];
        const instructions = ex.instructions ?? [];
        const images = ex.images ?? [];
        const equipment = inferEquipment(ex.name, ex.equipment);
        const force = ex.force ?? inferForce(ex.name, primaryMuscles, ex.category);
        const mechanic = ex.mechanic ?? inferMechanic(ex.name, ex.category);
        const muscleGroup = inferMuscleGroup(primaryMuscles);
        const tags = buildTags({
          force,
          mechanic,
          equipment,
          category: ex.category,
          level: ex.level,
          primaryMuscles,
        });
        const aliases = [ex.name, ex.id.replace(/_/g, " ")].filter(
          (v, idx, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === idx,
        );
        const popularity = popularityScore({
          category: ex.category,
          mechanic,
          level: ex.level,
          hasImages: images.length > 0,
          hasInstructions: instructions.length > 0,
        });

        return prisma.exercise.upsert({
          where: { id: ex.id },
          create: {
            id: ex.id,
            name: ex.name,
            force,
            level: ex.level,
            mechanic,
            equipment,
            category: ex.category,
            primaryMuscles,
            secondaryMuscles,
            instructions,
            images,
            muscleGroup,
            aliases,
            tags,
            source: "free-exercise-db",
            popularity,
          },
          update: {
            name: ex.name,
            force,
            level: ex.level,
            mechanic,
            equipment,
            category: ex.category,
            primaryMuscles,
            secondaryMuscles,
            instructions,
            images,
            muscleGroup,
            aliases,
            tags,
            source: "free-exercise-db",
            popularity,
          },
        });
      }),
    );
    console.log(`  upserted ${Math.min(i + batchSize, raw.length)} / ${raw.length}`);
  }

  const count = await prisma.exercise.count({ where: { source: "free-exercise-db" } });
  const nullEquip = await prisma.exercise.count({
    where: { source: "free-exercise-db", equipment: null },
  });
  console.log(`Done. ${count} free-exercise-db rows (null equipment remaining: ${nullEquip}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
