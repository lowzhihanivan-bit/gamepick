import { listGames } from "@/lib/queries";
import { GameCard } from "@/components/GameCard";
import { MoodPicker } from "@/components/MoodPicker";
import { SessionSetup } from "@/components/SessionSetup";
import type { Filters as FiltersT } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseSearch(sp: Record<string, string | string[] | undefined>): FiltersT {
  const num = (k: string) => {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    const n = s ? Number(s) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  const str = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    minPlayers: num("minPlayers"),
    maxPlayers: num("maxPlayers"),
    minTime: num("minTime"),
    maxTime: num("maxTime"),
    minWeight: num("minWeight"),
    maxWeight: num("maxWeight"),
    mood: str("mood"),
    sort: "match",
    page: num("page") ?? 1,
  };
}

export default async function TonightPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseSearch(sp);
  const { rows, total } = await listGames(filters);

  const hasSession =
    filters.minPlayers != null || filters.maxTime != null ||
    filters.minWeight != null || filters.maxWeight != null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Tonight&apos;s Session</h1>
        <p className="text-sm text-ink-dim">
          Set up your session and we&apos;ll rank games by how well they fit.
        </p>
      </div>

      <SessionSetup
        initialPlayers={filters.minPlayers}
        initialMaxTime={filters.maxTime}
        initialMinWeight={filters.minWeight}
        initialMaxWeight={filters.maxWeight}
      />

      <MoodPicker activeMood={filters.mood} />

      <div className="flex items-baseline justify-between mb-4">
        <p className="text-sm text-ink-dim">
          {total.toLocaleString()} games
          {hasSession ? ", ranked by best match" : ""}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-bg-soft p-10 text-center">
          <p className="text-lg">No games match your filters.</p>
          <p className="text-ink-dim text-sm mt-2">Try loosening the mood or session settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
