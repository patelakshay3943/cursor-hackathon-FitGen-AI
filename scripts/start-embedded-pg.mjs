import EmbeddedPostgres from "embedded-postgres";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const databaseDir = join(__dirname, "..", ".data", "pg");

mkdirSync(databaseDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "fitgen",
  password: "fitgen",
  port: 5433,
  persistent: true,
});

await pg.initialise();
await pg.start();

try {
  await pg.createDatabase("fitgen");
} catch (err) {
  const message = String(err?.message ?? err);
  if (!/already exists/i.test(message)) {
    console.warn("createDatabase:", message);
  }
}

console.log("Embedded Postgres ready on port 5433");
console.log("DATABASE_URL=postgresql://fitgen:fitgen@localhost:5433/fitgen");

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await pg.stop();
  process.exit(0);
});

await new Promise(() => {});
