import type { GameRow } from "@/lib/types";
import { confidenceFromVotes, consensusLabel } from "@/lib/format";
import { cn } from "@/lib/cn";

const toneClass: Record<"ok" | "warn" | "bad" | "ink-dim", string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  "ink-dim": "bg-ink-faint",
};

export function ScoreBreakdown({ game }: { game: GameRow }) {
  const conf = confidenceFromVotes(game.numRatings);
  const consensus = consensusLabel(game.consensus);
  const bayes = game.bayesAvg;
  const raw = game.rawAvg;
  const cohortPct =
    game.cohortPercentile != null ? Math.round(game.cohortPercentile * 100) : null;

  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-white/5 bg-bg-soft p-4">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">
          Bayesian rating
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">
            {bayes != null ? bayes.toFixed(2) : "—"}
          </span>
          <span className="text-xs text-ink-dim">
            raw {raw != null ? raw.toFixed(2) : "—"}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-ink-dim">
            <span>Confidence</span>
            <span>
              {conf.label} · {(game.numRatings ?? 0).toLocaleString()} ratings
            </span>
          </div>
          <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all", toneClass[conf.tone])}
              style={{ width: `${Math.round(conf.pct * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-bg-soft p-4">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">
          Player consensus
        </div>
        <div className="mt-1 text-lg font-medium">
          <span className={cn("inline-block w-2 h-2 rounded-full mr-2 align-middle", toneClass[consensus.tone])} />
          {consensus.label}
        </div>
        <p className="text-xs text-ink-dim mt-2 leading-relaxed">
          {game.consensus != null
            ? `Standard deviation ${game.consensus.toFixed(2)} across user ratings.`
            : "Not enough data to estimate spread."}
        </p>
        {cohortPct != null && game.cohortLabel ? (
          <p className="text-xs text-ink-dim mt-2">
            Rated higher than <span className="text-ink">{cohortPct}%</span> of{" "}
            <span className="text-ink">{game.cohortLabel}</span>.
          </p>
        ) : null}
      </div>
    </div>
  );
}
