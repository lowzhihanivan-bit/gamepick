import { listGames, listFacets } from "@/lib/queries";
import { Filters } from "@/components/Filters";
import { GameCard } from "@/components/GameCard";
import type { Filters as FiltersT } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseSearch(sp: Record<string, string | string[] | undefined>): FiltersT {
  const num = (k: string) => {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    const n = s ? Number(s) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  const list = (k: string) => {
    const v = sp[k];
    const s = Array.isArray(v) ? v.join(",") : v;
    return s ? s.split(",").filter(Boolean) : [];
  };
  const str = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    q: str("q"),
    minWeight: num("minWeight"),
    maxWeight: num("maxWeight"),
    minPlayers: num("minPlayers"),
    maxPlayers: num("maxPlayers"),
    minTime: num("minTime"),
    maxTime: num("maxTime"),
    categories: list("cat"),
    mechanics: list("mech"),
    mood: str("mood"),
    sort: (str("sort") as FiltersT["sort"]) ?? "bayes",
    page: num("page") ?? 1,
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseSearch(sp);
  const [facets, { rows, total }] = await Promise.all([
    listFacets(),
    listGames(filters),
  ]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3">
        <Filters facets={facets} initial={filters} />
      </aside>
      <section className="col-span-12 md:col-span-9">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {total.toLocaleString()} games
          </h1>
          <p className="text-sm text-ink-dim">
            Sorted by {labelForSort(filters.sort)}
          </p>
        </div>
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function labelForSort(s: FiltersT["sort"]) {
  switch (s) {
    case "bayes":
      return "Bayesian rating";
    case "consensus":
      return "consensus (low variance first)";
    case "weight":
      return "weight (light → heavy)";
    case "year":
      return "year (newest first)";
    default:
      return s;
  }
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-black/8 bg-bg-soft p-10 text-center">
      <p className="text-lg">No games yet.</p>
      <p className="text-ink-dim text-sm mt-2">
        Run <code className="text-accent">npm run db:init</code> then{" "}
        <code className="text-accent">npm run ingest</code> then{" "}
        <code className="text-accent">npm run compute</code> to populate the
        catalog.
      </p>
    </div>
  );
}
