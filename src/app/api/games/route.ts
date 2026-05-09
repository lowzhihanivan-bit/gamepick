import { NextResponse } from "next/server";
import { db } from "@/db/client";
import type { InValue } from "@libsql/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").map(Number).filter((n) => n > 0);
  if (!ids.length) return NextResponse.json([]);

  const placeholders = ids.map((_, i) => `:id${i}`).join(",");
  const args: Record<string, InValue> = {};
  ids.forEach((id, i) => { args[`id${i}`] = id; });

  const result = await db.execute({
    sql: `SELECT
            id, bgg_id AS bggId, name, year_published AS yearPublished,
            thumbnail, image, description,
            min_players AS minPlayers, max_players AS maxPlayers,
            min_playtime AS minPlaytime, max_playtime AS maxPlaytime,
            min_age AS minAge, weight, bgg_rank AS bggRank,
            raw_avg AS rawAvg, num_ratings AS numRatings,
            bayes_avg AS bayesAvg, consensus,
            cohort_label AS cohortLabel, cohort_percentile AS cohortPercentile,
            categories_json AS categoriesJson, mechanics_json AS mechanicsJson,
            histogram_json AS histogramJson,
            strengths_json AS strengthsJson, weaknesses_json AS weaknessesJson
          FROM games WHERE bgg_id IN (${placeholders})`,
    args,
  });

  return NextResponse.json(result.rows);
}
