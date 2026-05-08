"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import {
  saveSession,
  clearSession,
  bandFromParams,
  BAND_PARAMS,
  type WeightBand,
} from "@/lib/session";

const PLAYERS = [1, 2, 3, 4, 5, 6];
const TIMES = [
  { label: "≤30m", value: 30 },
  { label: "≤45m", value: 45 },
  { label: "≤1h", value: 60 },
  { label: "≤90m", value: 90 },
  { label: "≤2h", value: 120 },
];
const BANDS: { id: WeightBand; label: string; desc: string }[] = [
  { id: "light", label: "Light", desc: "Easy to learn" },
  { id: "medium", label: "Medium", desc: "Some strategy" },
  { id: "heavy", label: "Heavy", desc: "Complex & deep" },
];

export function SessionSetup({
  initialPlayers,
  initialMaxTime,
  initialMinWeight,
  initialMaxWeight,
}: {
  initialPlayers?: number;
  initialMaxTime?: number;
  initialMinWeight?: number;
  initialMaxWeight?: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const activePlayers = initialPlayers;
  const activeTime = initialMaxTime;
  const activeBand = bandFromParams(initialMinWeight, initialMaxWeight);
  const hasSession = activePlayers != null || activeTime != null || activeBand != null;

  function update(patch: {
    players?: number | null;
    maxTime?: number | null;
    band?: WeightBand | null;
  }) {
    const params = new URLSearchParams(sp.toString());

    if ("players" in patch) {
      if (patch.players == null) {
        params.delete("minPlayers");
        params.delete("maxPlayers");
      } else {
        params.set("minPlayers", String(patch.players));
        params.set("maxPlayers", String(patch.players));
      }
    }
    if ("maxTime" in patch) {
      patch.maxTime == null
        ? params.delete("maxTime")
        : params.set("maxTime", String(patch.maxTime));
    }
    if ("band" in patch) {
      params.delete("minWeight");
      params.delete("maxWeight");
      if (patch.band != null) {
        const b = BAND_PARAMS[patch.band];
        if (b.min != null) params.set("minWeight", String(b.min));
        if (b.max != null) params.set("maxWeight", String(b.max));
      }
    }

    params.delete("page");

    const newPlayers =
      "players" in patch
        ? (patch.players ?? undefined)
        : activePlayers;
    const newTime =
      "maxTime" in patch ? (patch.maxTime ?? undefined) : activeTime;
    const newBand =
      "band" in patch ? (patch.band ?? undefined) : activeBand;

    saveSession({
      players: newPlayers,
      maxTime: newTime,
      weightBand: newBand,
    });

    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function reset() {
    clearSession();
    const params = new URLSearchParams(sp.toString());
    params.delete("minPlayers");
    params.delete("maxPlayers");
    params.delete("maxTime");
    params.delete("minWeight");
    params.delete("maxWeight");
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="mb-6 rounded-xl border border-white/5 bg-bg-soft p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-wider text-ink-faint">
          Tonight&apos;s session
        </h2>
        {hasSession && (
          <button
            onClick={reset}
            className="text-xs text-ink-dim hover:text-ink"
          >
            clear ×
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Players */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-dim w-16 shrink-0">Players</span>
          <div className="flex gap-1.5 flex-wrap">
            {PLAYERS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() =>
                  update({ players: activePlayers === n ? null : n })
                }
                className={cn(
                  "px-2.5 py-1 rounded-md text-sm border transition-colors",
                  activePlayers === n
                    ? "bg-accent text-bg border-accent"
                    : "bg-bg border-white/5 text-ink-dim hover:border-accent/40"
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                update({ players: activePlayers === 7 ? null : 7 })
              }
              className={cn(
                "px-2.5 py-1 rounded-md text-sm border transition-colors",
                activePlayers === 7
                  ? "bg-accent text-bg border-accent"
                  : "bg-bg border-white/5 text-ink-dim hover:border-accent/40"
              )}
            >
              7+
            </button>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-dim w-16 shrink-0">Time</span>
          <div className="flex gap-1.5 flex-wrap">
            {TIMES.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  update({ maxTime: activeTime === value ? null : value })
                }
                className={cn(
                  "px-2.5 py-1 rounded-md text-sm border transition-colors",
                  activeTime === value
                    ? "bg-accent text-bg border-accent"
                    : "bg-bg border-white/5 text-ink-dim hover:border-accent/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Weight */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-dim w-16 shrink-0">Weight</span>
          <div className="flex gap-1.5 flex-wrap">
            {BANDS.map(({ id, label, desc }) => (
              <button
                key={id}
                type="button"
                title={desc}
                onClick={() =>
                  update({ band: activeBand === id ? null : id })
                }
                className={cn(
                  "px-2.5 py-1 rounded-md text-sm border transition-colors",
                  activeBand === id
                    ? "bg-accent text-bg border-accent"
                    : "bg-bg border-white/5 text-ink-dim hover:border-accent/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
