import { NextResponse } from "next/server";
import { db } from "@/db/client";
import type { InValue } from "@libsql/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const result = await db.execute({
    sql: `SELECT bgg_id AS bggId, name, year_published AS yearPublished
          FROM games
          WHERE LOWER(name) LIKE :q
          ORDER BY bayes_avg DESC NULLS LAST
          LIMIT 8`,
    args: { q: `%${q.toLowerCase()}%` },
  });

  return NextResponse.json(
    result.rows.map((r) => {
      const row = r as unknown as { bggId: number; name: string; yearPublished: number | null };
      return { bggId: row.bggId, name: row.name, year: row.yearPublished };
    })
  );
}
