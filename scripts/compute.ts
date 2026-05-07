/**
 * Post-ingest compute step.
 * Calculates: bayes_avg, consensus, cohort percentile/label, strengths/weaknesses JSON.
 * Idempotent — safe to re-run after each ingest.
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "boardgames.sqlite");
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

type Row = {
  id: number;
  bgg_id: number;
  name: string;
  weight: number | null;
  raw_avg: number | null;
  num_ratings: number | null;
  bgg_rank: number | null;
  min_players: number | null;
  max_players: number | null;
  min_playtime: number | null;
  max_playtime: number | null;
  histogram_json: string | null;
  categories_json: string | null;
  mechanics_json: string | null;
};

const all = db
  .prepare(
    `SELECT id, bgg_id, name, weight, raw_avg, num_ratings, bgg_rank,
            min_players, max_players, min_playtime, max_playtime,
            histogram_json, categories_json, mechanics_json
     FROM games`
  )
  .all() as Row[];

if (all.length === 0) {
  console.log("no games — run npm run ingest first");
  db.close();
  process.exit(0);
}

// Catalog mean rating, weighted by num_ratings (truncate-mean style).
const validAvgs = all.filter((r) => r.raw_avg != null && (r.num_ratings ?? 0) > 50);
const m =
  validAvgs.reduce((a, r) => a + (r.raw_avg ?? 0) * (r.num_ratings ?? 0), 0) /
  Math.max(1, validAvgs.reduce((a, r) => a + (r.num_ratings ?? 0), 0));

// Bayesian prior strength — the "imaginary" votes pulled toward the catalog mean.
// 1500 is comparable to BGG's own geek rating prior.
const C = 1500;

// Cohort definition: bucket games by weight.
const cohortOf = (w: number | null): { key: string; label: string } => {
  if (w == null) return { key: "unknown", label: "uncategorised" };
  if (w < 1.5) return { key: "light", label: "light family games" };
  if (w < 2.5) return { key: "medlight", label: "medium-light games" };
  if (w < 3.5) return { key: "medheavy", label: "medium-heavy games" };
  return { key: "heavy", label: "heavy strategy games" };
};

// First pass — compute Bayesian + consensus, group by cohort for percentile.
type Computed = {
  id: number;
  bayes: number | null;
  consensus: number | null;
  cohortKey: string;
  cohortLabel: string;
  strengths: string[];
  weaknesses: string[];
};

const computed: Computed[] = all.map((r) => {
  const n = r.num_ratings ?? 0;
  const avg = r.raw_avg ?? null;
  const bayes = avg != null && n > 0 ? (C * m + n * avg) / (C + n) : null;
  // We stored stddev as histogram_json[0] when full hist isn't available.
  let consensus: number | null = null;
  if (r.histogram_json) {
    try {
      const arr = JSON.parse(r.histogram_json) as number[];
      if (arr.length === 1) consensus = arr[0]; // stddev fallback
      else if (arr.length === 10) consensus = stddevFromHistogram(arr);
    } catch {
      /* ignore */
    }
  }
  const c = cohortOf(r.weight);
  return {
    id: r.id,
    bayes,
    consensus,
    cohortKey: c.key,
    cohortLabel: c.label,
    strengths: [],
    weaknesses: [],
  };
});

// Second pass — cohort percentile within each cohort by bayes.
const byCohort = new Map<string, { id: number; bayes: number | null }[]>();
for (const c of computed) {
  if (!byCohort.has(c.cohortKey)) byCohort.set(c.cohortKey, []);
  byCohort.get(c.cohortKey)!.push({ id: c.id, bayes: c.bayes });
}
const percentile = new Map<number, number>();
for (const list of byCohort.values()) {
  const sorted = [...list].sort((a, b) => (b.bayes ?? -Infinity) - (a.bayes ?? -Infinity));
  const total = sorted.length;
  sorted.forEach((row, i) => {
    // Top of cohort = high percentile (i.e. 100 = best).
    const pct = total > 1 ? 1 - i / (total - 1) : 1;
    percentile.set(row.id, pct);
  });
}

// Third pass — strengths/weaknesses (rule-based, derived from objective attributes).
const rowById = new Map(all.map((r) => [r.id, r]));
for (const c of computed) {
  const r = rowById.get(c.id)!;
  const { strengths, weaknesses } = deriveTraits(r, c);
  c.strengths = strengths;
  c.weaknesses = weaknesses;
}

// Persist.
const upd = db.prepare(`
  UPDATE games SET
    bayes_avg = @bayes,
    consensus = @consensus,
    cohort_label = @cohortLabel,
    cohort_percentile = @pct,
    strengths_json = @str,
    weaknesses_json = @weak
  WHERE id = @id
`);

const tx = db.prepare("BEGIN");
const commit = db.prepare("COMMIT");
tx.run();
for (const c of computed) {
  upd.run({
    id: c.id,
    bayes: c.bayes,
    consensus: c.consensus,
    cohortLabel: c.cohortLabel,
    pct: percentile.get(c.id) ?? null,
    str: JSON.stringify(c.strengths),
    weak: JSON.stringify(c.weaknesses),
  });
}
commit.run();

console.log(
  `✓ computed ${computed.length} games (catalog mean ${m.toFixed(3)}, prior C=${C})`
);
db.close();

/* ---------- helpers ---------- */

function stddevFromHistogram(votesPerRating: number[]): number {
  // votesPerRating[i] = count of ratings with score (i+1)
  let n = 0;
  let sum = 0;
  for (let i = 0; i < votesPerRating.length; i += 1) {
    n += votesPerRating[i];
    sum += (i + 1) * votesPerRating[i];
  }
  if (n === 0) return 0;
  const mean = sum / n;
  let sqDiff = 0;
  for (let i = 0; i < votesPerRating.length; i += 1) {
    sqDiff += votesPerRating[i] * Math.pow(i + 1 - mean, 2);
  }
  return Math.sqrt(sqDiff / n);
}

function deriveTraits(
  r: Row,
  c: Computed
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const cats: string[] = safeArr(r.categories_json);
  const mechs: string[] = safeArr(r.mechanics_json);
  const w = r.weight;
  const minT = r.min_playtime ?? 0;
  const maxT = r.max_playtime ?? 0;
  const minP = r.min_players ?? 0;
  const maxP = r.max_players ?? 0;
  const n = r.num_ratings ?? 0;
  const consensus = c.consensus;

  // Length
  if (maxT > 0 && maxT <= 30) strengths.push("Quick — under 30 minutes");
  else if (maxT > 0 && maxT <= 60) strengths.push("Reasonable length (about an hour)");
  if (maxT >= 180) weaknesses.push(`Long sessions — up to ${maxT} minutes`);

  // Weight
  if (w != null && w < 1.6) strengths.push("Easy to teach (light complexity)");
  if (w != null && w >= 3.5) weaknesses.push("Heavy rules — steep learning curve");
  if (w != null && w >= 4.0) weaknesses.push("Long teach — expect 30+ minutes for the first game");

  // Player range
  if (maxP - minP >= 4 && maxP >= 6) strengths.push("Scales across many group sizes");
  if (maxP === 1 || (minP === 1 && maxP <= 2)) strengths.push("Solo or two-player friendly");
  if (minP >= 3) weaknesses.push(`Needs at least ${minP} players`);

  // Mechanics that imply something concrete
  if (mechs.includes("Cooperative Game")) strengths.push("Cooperative — players win or lose together");
  if (mechs.includes("Hidden Roles") || mechs.includes("Traitor Game"))
    weaknesses.push("Hidden roles / lying — not for everyone");
  if (mechs.includes("Player Elimination"))
    weaknesses.push("Player elimination — knocked-out players wait it out");
  if (mechs.includes("Negotiation") || mechs.includes("Trading"))
    strengths.push("Big social / negotiation element");
  if (mechs.includes("Dice Rolling") && !mechs.includes("Action Drafting"))
    strengths.push("Dice-driven — leans casual, swingier outcomes");
  if (mechs.includes("Worker Placement")) strengths.push("Worker placement — tactical action selection");
  if (mechs.includes("Deck, Bag, and Pool Building")) strengths.push("Deckbuilding — engine-building over the game");
  if (mechs.includes("Legacy Game")) {
    strengths.push("Legacy — the game world evolves session to session");
    weaknesses.push("Legacy — components change permanently; one playthrough only");
  }
  if (mechs.includes("Solo / Solitaire Game")) strengths.push("Strong solo mode included");

  // Categories that flag a vibe
  if (cats.includes("Children's Game")) strengths.push("Family-friendly — designed for kids");
  if (cats.includes("Party Game")) strengths.push("Party-feel — works with non-gamers");
  if (cats.includes("Wargame")) weaknesses.push("Wargame depth — niche for non-fans");

  // Consensus / sample size
  if (consensus != null && consensus < 1.4 && n >= 1000)
    strengths.push("Players strongly agree — high consensus rating");
  if (consensus != null && consensus >= 2.2)
    weaknesses.push("Polarising — wide spread in player ratings");
  if (n < 200)
    weaknesses.push(`Few ratings yet (${n}) — confidence in the score is limited`);

  return { strengths: dedupe(strengths), weaknesses: dedupe(weaknesses) };
}

function dedupe(xs: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

function safeArr(json: string | null): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}
