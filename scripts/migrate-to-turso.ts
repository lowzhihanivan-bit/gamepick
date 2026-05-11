/**
 * One-time migration: copies all rows from local SQLite → Turso.
 * Run with:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npx tsx --no-warnings scripts/migrate-to-turso.ts
 */

import { DatabaseSync } from "node:sqlite";
import { createClient } from "@libsql/client";
import path from "node:path";
import { CREATE_GAMES_SQL } from "../src/db/schema";

const DB_PATH = path.join(process.cwd(), "data", "boardgames.sqlite");
const BATCH_SIZE = 50;

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  process.exit(1);
}

const local = new DatabaseSync(DB_PATH);
const remote = createClient({ url, authToken });

type Row = Record<string, string | number | null>;

async function main() {
  console.log("Creating schema on Turso...");
  for (const stmt of CREATE_GAMES_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
    await remote.execute(stmt);
  }

  // Add new columns if they don't exist yet (idempotent)
  for (const col of [
    "ALTER TABLE games ADD COLUMN best_players_min INTEGER",
    "ALTER TABLE games ADD COLUMN best_players_max INTEGER",
  ]) {
    try { await remote.execute(col); } catch { /* already exists */ }
  }

  const rows = local.prepare("SELECT * FROM games").all() as Row[];
  console.log(`Migrating ${rows.length} rows...`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await remote.batch(
      batch.map((r) => ({
        sql: `INSERT OR REPLACE INTO games (
          id, bgg_id, name, year_published, thumbnail, image, description,
          min_players, max_players, best_players_min, best_players_max,
          min_playtime, max_playtime, min_age,
          weight, bgg_rank, raw_avg, num_ratings, bayes_avg, consensus,
          cohort_label, cohort_percentile, categories_json, mechanics_json,
          histogram_json, strengths_json, weaknesses_json, fetched_at
        ) VALUES (
          :id, :bgg_id, :name, :year_published, :thumbnail, :image, :description,
          :min_players, :max_players, :best_players_min, :best_players_max,
          :min_playtime, :max_playtime, :min_age,
          :weight, :bgg_rank, :raw_avg, :num_ratings, :bayes_avg, :consensus,
          :cohort_label, :cohort_percentile, :categories_json, :mechanics_json,
          :histogram_json, :strengths_json, :weaknesses_json, :fetched_at
        )`,
        args: r as Record<string, string | number | null>,
      })),
      "write"
    );
    console.log(`  ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }

  console.log("✓ Migration complete");
  local.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
