import { unstable_cache } from "next/cache";
import { db } from "@/db/client";
import type { Filters, Facets, GameRow } from "./types";
import { moodsToSql } from "./moods";
import type { InValue } from "@libsql/client";

const PAGE_SIZE = 30;

export async function listGames(f: Filters): Promise<{ rows: GameRow[]; total: number }> {
  const where: string[] = ["1=1"];
  const params: Record<string, InValue> = {};

  if (f.q && f.q.trim()) {
    where.push("LOWER(name) LIKE :q");
    params.q = `%${f.q.toLowerCase()}%`;
  }
  if (f.minWeight != null) {
    where.push("(weight IS NULL OR weight >= :minWeight)");
    params.minWeight = f.minWeight;
  }
  if (f.maxWeight != null) {
    where.push("(weight IS NULL OR weight <= :maxWeight)");
    params.maxWeight = f.maxWeight;
  }
  if (f.minPlayers != null) {
    where.push("(max_players IS NULL OR max_players >= :minPlayers)");
    params.minPlayers = f.minPlayers;
  }
  if (f.maxPlayers != null) {
    where.push("(min_players IS NULL OR min_players <= :maxPlayers)");
    params.maxPlayers = f.maxPlayers;
  }
  if (f.minTime != null) {
    where.push("(max_playtime IS NULL OR max_playtime >= :minTime)");
    params.minTime = f.minTime;
  }
  if (f.maxTime != null) {
    where.push("(min_playtime IS NULL OR min_playtime <= :maxTime)");
    params.maxTime = f.maxTime;
  }
  if (f.categories && f.categories.length) {
    f.categories.forEach((c, i) => {
      where.push(`categories_json LIKE :cat${i}`);
      params[`cat${i}`] = `%"${escapeLike(c)}"%`;
    });
  }
  if (f.mechanics && f.mechanics.length) {
    f.mechanics.forEach((m, i) => {
      where.push(`mechanics_json LIKE :mech${i}`);
      params[`mech${i}`] = `%"${escapeLike(m)}"%`;
    });
  }
  if (f.moods && f.moods.length) {
    const ms = moodsToSql(f.moods);
    if (ms) {
      where.push(`(${ms.sql})`);
      Object.assign(params, ms.params);
    }
  }

  let orderBy: string;
  const matchParams: Record<string, InValue> = {};
  if (f.sort === "match") {
    matchParams._mp = f.minPlayers ?? null;
    matchParams._mt = f.maxTime ?? null;
    matchParams._mw = f.maxWeight ?? null;
    orderBy = `(
      COALESCE(CASE WHEN :_mp IS NOT NULL AND min_players IS NOT NULL AND max_players IS NOT NULL
        AND min_players <= :_mp AND max_players >= :_mp THEN 3.0 ELSE 0.0 END, 0.0) +
      COALESCE(CASE WHEN :_mt IS NOT NULL AND max_playtime IS NOT NULL AND CAST(:_mt AS REAL) > 0
        THEN 2.0 * (1.0 - CAST(max_playtime AS REAL) / CAST(:_mt AS REAL)) ELSE 0.0 END, 0.0) +
      COALESCE(CASE WHEN :_mw IS NOT NULL AND weight IS NOT NULL AND CAST(:_mw AS REAL) > 0
        THEN 2.0 * (1.0 - weight / CAST(:_mw AS REAL)) ELSE 0.0 END, 0.0)
    ) DESC, bayes_avg DESC NULLS LAST`;
  } else {
    orderBy = (() => {
      switch (f.sort) {
        case "consensus":
          return "consensus ASC NULLS LAST, bayes_avg DESC NULLS LAST";
        case "weight":
          return "weight ASC NULLS LAST, bayes_avg DESC NULLS LAST";
        case "year":
          return "year_published DESC NULLS LAST, bayes_avg DESC NULLS LAST";
        case "year-asc":
          return "year_published ASC NULLS LAST, bayes_avg DESC NULLS LAST";
        case "bayes":
        default:
          return "bayes_avg DESC NULLS LAST, num_ratings DESC NULLS LAST";
      }
    })();
  }

  const whereSql = where.join(" AND ");

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM games WHERE ${whereSql}`,
    args: params,
  });
  const total = Number((countResult.rows[0] as Record<string, InValue>).c ?? 0);

  const offset = ((f.page ?? 1) - 1) * PAGE_SIZE;
  const dataResult = await db.execute({
    sql: `SELECT
         id, bgg_id AS bggId, name, year_published AS yearPublished,
         thumbnail, image, description,
         min_players AS minPlayers, max_players AS maxPlayers,
         best_players_min AS bestPlayersMin, best_players_max AS bestPlayersMax,
         min_playtime AS minPlaytime, max_playtime AS maxPlaytime,
         min_age AS minAge, weight, bgg_rank AS bggRank,
         raw_avg AS rawAvg, num_ratings AS numRatings,
         bayes_avg AS bayesAvg, consensus,
         cohort_label AS cohortLabel, cohort_percentile AS cohortPercentile,
         categories_json AS categoriesJson, mechanics_json AS mechanicsJson,
         histogram_json AS histogramJson,
         strengths_json AS strengthsJson, weaknesses_json AS weaknessesJson
       FROM games
       WHERE ${whereSql}
       ORDER BY ${orderBy}
       LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    args: { ...params, ...matchParams },
  });

  const rows = dataResult.rows as unknown as GameRow[];
  return { rows, total };
}

export async function getGameByBggId(bggId: number): Promise<GameRow | null> {
  const result = await db.execute({
    sql: `SELECT
         id, bgg_id AS bggId, name, year_published AS yearPublished,
         thumbnail, image, description,
         min_players AS minPlayers, max_players AS maxPlayers,
         best_players_min AS bestPlayersMin, best_players_max AS bestPlayersMax,
         min_playtime AS minPlaytime, max_playtime AS maxPlaytime,
         min_age AS minAge, weight, bgg_rank AS bggRank,
         raw_avg AS rawAvg, num_ratings AS numRatings,
         bayes_avg AS bayesAvg, consensus,
         cohort_label AS cohortLabel, cohort_percentile AS cohortPercentile,
         categories_json AS categoriesJson, mechanics_json AS mechanicsJson,
         histogram_json AS histogramJson,
         strengths_json AS strengthsJson, weaknesses_json AS weaknessesJson
       FROM games WHERE bgg_id = :bggId`,
    args: { bggId },
  });
  return (result.rows[0] as unknown as GameRow) ?? null;
}

export const listFacets = unstable_cache(async function _listFacets(): Promise<Facets> {
  const result = await db.execute(
    `SELECT categories_json, mechanics_json, weight FROM games`
  );

  const cats = new Map<string, number>();
  const mechs = new Map<string, number>();
  let wMin = Infinity;
  let wMax = -Infinity;

  for (const r of result.rows) {
    const row = r as unknown as {
      categories_json: string | null;
      mechanics_json: string | null;
      weight: number | null;
    };
    if (row.weight != null) {
      if (row.weight < wMin) wMin = row.weight;
      if (row.weight > wMax) wMax = row.weight;
    }
    safeAdd(cats, row.categories_json);
    safeAdd(mechs, row.mechanics_json);
  }

  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }));

  return {
    categories: top(cats, 25),
    mechanics: top(mechs, 30),
    weightRange: {
      min: Number.isFinite(wMin) ? Math.floor(wMin * 10) / 10 : 1,
      max: Number.isFinite(wMax) ? Math.ceil(wMax * 10) / 10 : 5,
    },
  };
}, ["facets"], { revalidate: 3600 });

function safeAdd(map: Map<string, number>, json: string | null) {
  if (!json) return;
  try {
    const arr = JSON.parse(json) as string[];
    for (const v of arr) map.set(v, (map.get(v) ?? 0) + 1);
  } catch {
    /* ignore */
  }
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}
