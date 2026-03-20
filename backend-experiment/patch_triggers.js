/**
 * StudyFlow — Patch: create update_updated_at_column() function + all triggers
 * Run: node server/patch_triggers.js
 */
import pkg from "pg";
const { Client } = pkg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_D18wcHEKfNPu@ep-long-snow-aluwekhh-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const tablesWithUpdatedAt = [
  "profiles",
  "conversations",
  "flashcard_decks",
  "upgrade_requests",
];

async function patch() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("✅ Connected to Neon\n");

  // 1. Create the helper function using a single query (not split)
  await client.query(`
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SET search_path = public;
  `);
  console.log("✅ Function: update_updated_at_column created");

  // 2. Create triggers for all tables with updated_at
  for (const table of tablesWithUpdatedAt) {
    const triggerName = `update_${table}_updated_at`;
    try {
      await client.query(`DROP TRIGGER IF EXISTS ${triggerName} ON public.${table};`);
      await client.query(`
        CREATE TRIGGER ${triggerName}
        BEFORE UPDATE ON public.${table}
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
      `);
      console.log(`  ✅ Trigger: ${triggerName}`);
    } catch (err) {
      console.error(`  ❌ ${triggerName}: ${err.message}`);
    }
  }

  await client.end();
  console.log("\n🎉 All triggers are set up! Neon database is fully ready.");
}

patch().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
