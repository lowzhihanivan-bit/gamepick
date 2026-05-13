import { NextResponse } from "next/server";
import { db } from "@/db/client";

// One-time migration endpoint — adds new columns to the Turso DB.
// Visit /api/db-migrate once to apply, then it's safe to call again (idempotent).
export async function GET() {
  const results: string[] = [];

  const migrations = [
    "ALTER TABLE games ADD COLUMN best_players_min INTEGER",
    "ALTER TABLE games ADD COLUMN best_players_max INTEGER",
  ];

  for (const sql of migrations) {
    try {
      await db.execute(sql);
      results.push(`✓ ${sql}`);
    } catch {
      results.push(`— already exists: ${sql.split(" ADD COLUMN ")[1]}`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
