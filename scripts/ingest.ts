/**
 * Ingest path — Recommend.Games public JSON API.
 *
 * Single source: https://recommend.games/api/games/?ordering=bgg_rank&page=N
 *   - Page size is capped at 25 server-side (limit=N is ignored).
 *   - Includes: bgg_rank, name, year, description, image_url, min/max players,
 *     min/max time, min_age, category_name[], mechanic_name[], complexity,
 *     stddev_rating, bayes_rating, avg_rating, num_votes, cooperative flag,
 *     kennerspiel_score, language_dependency, min_players_best, etc.
 *
 * Filtered to bgg_rank <= TARGET (default 3000).
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { CREATE_GAMES_SQL } from "../src/db/schema";

const TARGET = Number(process.env.TARGET ?? 3000);
const DB_PATH = path.join(process.cwd(), "data", "boardgames.sqlite");
const REQ_DELAY_MS = 250;

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec(CREATE_GAMES_SQL);

type Game = {
  bgg_id: number;
  name: string;
  year: number | null;
  description: string | null;
  image_url: string | string[] | null;
  min_players: number | null;
  max_players: number | null;
  min_players_best: number | null;
  min_players_rec: number | null;
  max_players_best: number | null;
  max_players_rec: number | null;
  min_age: number | null;
  min_time: number | null;
  max_time: number | null;
  cooperative: boolean | null;
  bgg_rank: number | null;
  num_votes: number | null;
  avg_rating: number | null;
  stddev_rating: number | null;
  bayes_rating: number | null;
  complexity: number | null;
  language_dependency: number | null;
  kennerspiel_score: number | null;
  category_name: string[];
  mechanic_name: string[];
  game_type_name?: string[];
  available_on_bga?: boolean | null;
};

type Page = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Game[];
};

main().catch((e) => {
  console.error(e);
  db.close();
  process.exit(1);
});

async function main() {
  const upsert = db.prepare(`
    INSERT INTO games (
      bgg_id, name, year_published, thumbnail, image, description,
      min_players, max_players, best_players_min, best_players_max,
      min_playtime, max_playtime, min_age,
      weight, bgg_rank, raw_avg, num_ratings,
      categories_json, mechanics_json, histogram_json, fetched_at
    ) VALUES (
      @bggId, @name, @year, @thumb, @image, @desc,
      @minP, @maxP, @bestMinP, @bestMaxP, @minT, @maxT, @minAge,
      @weight, @rank, @rawAvg, @numRatings,
      @cats, @mechs, @hist, @ts
    )
    ON CONFLICT(bgg_id) DO UPDATE SET
      name=excluded.name,
      year_published=excluded.year_published,
      thumbnail=excluded.thumbnail,
      image=excluded.image,
      description=excluded.description,
      min_players=excluded.min_players,
      max_players=excluded.max_players,
      best_players_min=excluded.best_players_min,
      best_players_max=excluded.best_players_max,
      min_playtime=excluded.min_playtime,
      max_playtime=excluded.max_playtime,
      min_age=excluded.min_age,
      weight=excluded.weight,
      bgg_rank=excluded.bgg_rank,
      raw_avg=excluded.raw_avg,
      num_ratings=excluded.num_ratings,
      categories_json=excluded.categories_json,
      mechanics_json=excluded.mechanics_json,
      histogram_json=excluded.histogram_json,
      fetched_at=excluded.fetched_at
  `);

  let url: string | null =
    `https://recommend.games/api/games/?bgg_rank__lte=${TARGET}&ordering=bgg_rank`;
  let inserted = 0;
  let page = 0;

  db.prepare("BEGIN").run();
  try {
    while (url) {
      page += 1;
      const data: Page = await fetchJson(url);
      for (const g of data.results) {
        if (g.bgg_rank == null || g.bgg_rank > TARGET) continue;
        // Use stddev as the consensus signal — store as a single-element array
        // for the histogram column so compute.ts picks it up via its existing path.
        const hist = g.stddev_rating != null ? [g.stddev_rating] : [];
        const z = <T>(v: T | null | undefined): T | null => (v == null ? null : v);
        const imgUrl = Array.isArray(g.image_url) ? g.image_url[0] ?? null : g.image_url;
        upsert.run({
          bggId: g.bgg_id,
          name: g.name ?? `#${g.bgg_id}`,
          year: z(g.year),
          thumb: z(thumbnailFrom(imgUrl)),
          image: z(imgUrl),
          desc: z(g.description),
          minP: z(g.min_players),
          maxP: z(g.max_players),
          bestMinP: z(g.min_players_best),
          bestMaxP: z(g.max_players_best),
          minT: z(g.min_time),
          maxT: z(g.max_time),
          minAge: z(g.min_age),
          weight: z(g.complexity),
          rank: z(g.bgg_rank),
          rawAvg: z(g.avg_rating),
          numRatings: z(g.num_votes),
          cats: JSON.stringify(g.category_name ?? []),
          mechs: JSON.stringify(g.mechanic_name ?? []),
          hist: JSON.stringify(hist),
          ts: Date.now(),
        });
        inserted += 1;
      }
      console.log(`  page ${page} → ${inserted}/${TARGET}`);
      url = data.next;
      if (url) await sleep(REQ_DELAY_MS);
    }
    db.prepare("COMMIT").run();
  } catch (e) {
    db.prepare("ROLLBACK").run();
    throw e;
  }

  console.log(`✓ ingested ${inserted} games`);
  db.close();
}

async function fetchJson<T>(url: string, attempt = 0): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "theshelf/0.1",
      accept: "application/json",
    },
  });
  if (res.ok) return (await res.json()) as T;
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    const wait = 1000 * Math.pow(2, attempt);
    console.warn(`  ! ${res.status} on ${url} — retry in ${wait}ms`);
    await sleep(wait);
    return fetchJson<T>(url, attempt + 1);
  }
  throw new Error(`Fetch failed ${res.status} for ${url}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Recommend.Games image URLs go through a CDN that serves originals. Build a
 * smaller thumbnail variant by appending a query — falling back to the original
 * if the CDN doesn't honour the param.
 */
function thumbnailFrom(image: string | null): string | null {
  if (!image) return null;
  // BGG geekdo CDN supports image transformation paths; we keep it simple by
  // returning the same URL — the catalog cards lazy-load and resize via CSS.
  return image;
}

// Suppress unused export warning when ingest.ts is run standalone.
void fs;
void path;
