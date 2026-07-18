import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

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

  console.log(`Seeding ${raw.length} exercises...`);

  const batchSize = 50;
  for (let i = 0; i < raw.length; i += batchSize) {
    const batch = raw.slice(i, i + batchSize);
    await Promise.all(
      batch.map((ex) =>
        prisma.exercise.upsert({
          where: { id: ex.id },
          create: {
            id: ex.id,
            name: ex.name,
            force: ex.force,
            level: ex.level,
            mechanic: ex.mechanic,
            equipment: ex.equipment,
            category: ex.category,
            primaryMuscles: ex.primaryMuscles,
            secondaryMuscles: ex.secondaryMuscles,
            instructions: ex.instructions,
            images: ex.images,
          },
          update: {
            name: ex.name,
            force: ex.force,
            level: ex.level,
            mechanic: ex.mechanic,
            equipment: ex.equipment,
            category: ex.category,
            primaryMuscles: ex.primaryMuscles,
            secondaryMuscles: ex.secondaryMuscles,
            instructions: ex.instructions,
            images: ex.images,
          },
        }),
      ),
    );
    console.log(`  upserted ${Math.min(i + batchSize, raw.length)} / ${raw.length}`);
  }

  const count = await prisma.exercise.count();
  console.log(`Done. ${count} exercises in database.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
