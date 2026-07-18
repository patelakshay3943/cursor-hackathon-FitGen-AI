#!/usr/bin/env node
/**
 * On Render boot: push schema, seed exercises if the catalog is empty.
 */
const { spawnSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

async function main() {
  console.log("[render] prisma db push…");
  run("npx", ["prisma", "db", "push", "--skip-generate"]);

  const prisma = new PrismaClient();
  try {
    const count = await prisma.exercise.count();
    console.log(`[render] exercise count: ${count}`);
    if (count === 0) {
      console.log("[render] seeding exercise catalog (first boot)…");
      run("npm", ["run", "db:enrich"]);
    } else {
      console.log("[render] catalog present — skip seed");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[render] bootstrap failed:", err);
  process.exit(1);
});
