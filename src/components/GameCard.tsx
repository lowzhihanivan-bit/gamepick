import type { GameRow } from "@/lib/types";
import {
  fmtPlayers,
  fmtBestPlayers,
  fmtTime,
  weightLabel,
  consensusLabel,
  confidenceFromVotes,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { WishlistButton } from "@/components/WishlistButton";

const toneClass: Record<"ok" | "warn" | "bad" | "ink-dim", string> = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  "ink-dim": "text-ink-dim",
};

export function GameCard({ game }: { game: GameRow }) {
  const cats: string[] = safeArr(game.categoriesJson);
  const mechs: string[] = safeArr(game.mechanicsJson);
  const consensus = consensusLabel(game.consensus);
  const conf = confidenceFromVotes(game.numRatings);

  return (
    <a
      href={`/games/${game.bggId}`}
      className="group rounded-2xl border border-white/5 bg-bg-card hover:border-accent/40 transition overflow-hidden flex flex-col"
    >
      <div className="aspect-[16/10] bg-bg-soft relative overflow-hidden">
        {game.thumbnail ? (
          // Plain <img> avoids configuring next/image domains for every CDN host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.thumbnail}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint text-xs">
            no image
          </div>
        )}
        <WishlistButton bggId={game.bggId} />
        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-xs font-mono">
          {fmtScore(game.bayesAvg ?? game.rawAvg)}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-semibold tracking-tight leading-snug line-clamp-2">
            {game.name}
          </h3>
          <span className="text-xs text-ink-faint shrink-0">
            {game.yearPublished ?? ""}
          </span>
        </div>

        <p className="mt-1 text-xs text-ink-dim">
          {fmtPlayers(game.minPlayers, game.maxPlayers)} players
          {fmtBestPlayers(game.bestPlayersMin, game.bestPlayersMax) && (
            <span className="text-accent/80"> · {fmtBestPlayers(game.bestPlayersMin, game.bestPlayersMax)}</span>
          )} · {fmtTime(game.minPlaytime, game.maxPlaytime)} · {weightLabel(game.weight)}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {cats.slice(0, 2).map((c) => (
            <span
              key={c}
              className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-ink-dim"
            >
              {c}
            </span>
          ))}
          {mechs.slice(0, 2).map((m) => (
            <span
              key={m}
              className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-soft"
            >
              {m}
            </span>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <span className={cn("flex items-center gap-1", toneClass[consensus.tone])} title={consensus.tooltip}>
            <Dot tone={consensus.tone} />
            {consensus.label}
          </span>
          <span className={cn("flex items-center gap-1", toneClass[conf.tone])} title={`${conf.tooltip} (${(game.numRatings ?? 0).toLocaleString()} ratings)`}>
            {conf.label}
            <span className="text-ink-faint">
              ({(game.numRatings ?? 0).toLocaleString()})
            </span>
          </span>
        </div>
      </div>
    </a>
  );
}

function fmtScore(s: number | null) {
  if (s == null) return "—";
  return s.toFixed(1);
}

function safeArr(json: string | null): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

function Dot({ tone }: { tone: "ok" | "warn" | "bad" | "ink-dim" }) {
  const cls =
    tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : tone === "bad" ? "bg-bad" : "bg-ink-faint";
  return <span className={cn("inline-block w-1.5 h-1.5 rounded-full", cls)} />;
}
