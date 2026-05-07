import { getGameByBggId } from "@/lib/queries";
import { notFound } from "next/navigation";
import {
  fmtPlayers,
  fmtTime,
  weightLabel,
  consensusLabel,
  confidenceFromVotes,
} from "@/lib/format";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { WhyForYou } from "@/components/WhyForYou";

export const dynamic = "force-dynamic";

export default async function GamePage({
  params,
}: {
  params: Promise<{ bggId: string }>;
}) {
  const { bggId } = await params;
  const game = await getGameByBggId(Number(bggId));
  if (!game) return notFound();

  const cats: string[] = safeArr(game.categoriesJson);
  const mechs: string[] = safeArr(game.mechanicsJson);
  const strengths: string[] = safeArr(game.strengthsJson);
  const weaknesses: string[] = safeArr(game.weaknessesJson);

  return (
    <article className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-5">
        <div className="aspect-square rounded-2xl overflow-hidden bg-bg-soft border border-white/5">
          {game.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <Stat label="Players" value={fmtPlayers(game.minPlayers, game.maxPlayers)} />
          <Stat label="Length" value={fmtTime(game.minPlaytime, game.maxPlaytime)} />
          <Stat label="Weight" value={`${weightLabel(game.weight)}${game.weight ? ` (${game.weight.toFixed(1)})` : ""}`} />
        </div>
      </div>

      <div className="col-span-12 md:col-span-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{game.name}</h1>
            <p className="text-ink-dim text-sm mt-1">
              {game.yearPublished} · BGG rank{" "}
              {game.bggRank ? `#${game.bggRank}` : "—"}
            </p>
          </div>
          <a
            href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
            target="_blank"
            rel="noopener"
            className="text-xs text-ink-dim hover:text-accent border border-white/10 rounded-md px-2 py-1"
          >
            View on BGG ↗
          </a>
        </div>

        <ScoreBreakdown game={game} />

        <section className="mt-6">
          <h2 className="text-sm uppercase tracking-wider text-ink-faint mb-2">
            Strengths
          </h2>
          {strengths.length === 0 ? (
            <p className="text-sm text-ink-dim">—</p>
          ) : (
            <ul className="space-y-1.5">
              {strengths.map((s) => (
                <li key={s} className="flex gap-2 text-sm">
                  <span className="text-ok">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5">
          <h2 className="text-sm uppercase tracking-wider text-ink-faint mb-2">
            Things to know
          </h2>
          {weaknesses.length === 0 ? (
            <p className="text-sm text-ink-dim">—</p>
          ) : (
            <ul className="space-y-1.5">
              {weaknesses.map((w) => (
                <li key={w} className="flex gap-2 text-sm">
                  <span className="text-warn">!</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <WhyForYou
          weight={game.weight}
          minPlayers={game.minPlayers}
          maxPlayers={game.maxPlayers}
          maxPlaytime={game.maxPlaytime}
          categories={cats}
          mechanics={mechs}
        />

        <section className="mt-6">
          <h2 className="text-sm uppercase tracking-wider text-ink-faint mb-2">
            Tags
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-ink-dim">
                {c}
              </span>
            ))}
            {mechs.map((m) => (
              <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-soft">
                {m}
              </span>
            ))}
          </div>
        </section>

        {game.description ? (
          <section className="mt-6">
            <h2 className="text-sm uppercase tracking-wider text-ink-faint mb-2">
              About
            </h2>
            <p className="text-sm text-ink whitespace-pre-line leading-relaxed">
              {game.description.length > 1200
                ? game.description.slice(0, 1200) + "…"
                : game.description}
            </p>
          </section>
        ) : null}
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-bg-soft px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">
        {label}
      </div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}

function safeArr(json: string | null): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

// Suppress unused warning when consensusLabel/confidenceFromVotes only used inside ScoreBreakdown.
void consensusLabel;
void confidenceFromVotes;
