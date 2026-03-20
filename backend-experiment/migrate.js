import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pkg from "pg";
import dotenv from "dotenv";

const { Client } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from server directory
dotenv.config({ path: join(__dirname, ".env") });

const DATABASE_URL = process.env.DATABASE_URL;

const log = [];
const out = (msg) => { console.log(msg); log.push(msg); };

async function migrate() {
  if (!DATABASE_URL) {
    out("❌ Error: No DATABASE_URL in environment.");
    process.exit(1);
  }

  const client = new Client({ connectionString: DATABASE_URL });
  out("📡 Connecting to Neon...");
  await client.connect();
  out("✅ Connected!\n");

  const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
  out(`🚀 Running full schema migration...\n`);

  try {
    await client.query(sql);
    out(`  ✅ Schema applied successfully!`);
  } catch (err) {
    out(`  ❌ Migration failed: ${err.message}`);
    process.exit(1);
  }

  await client.end();
  writeFileSync(join(__dirname, "migrate.log"), log.join("\n"), "utf8");
  out("\n📋 Full log saved to server/migrate.log");
}

migrate().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
