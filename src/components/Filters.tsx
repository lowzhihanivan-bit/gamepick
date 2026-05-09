"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
import type { Facets, Filters as FiltersT } from "@/lib/types";
import { cn } from "@/lib/cn";

type Suggestion = { bggId: number; name: string; year: number | null };

export function Filters({
  facets,
  initial,
}: {
  facets: Facets;
  initial: FiltersT;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(initial.q ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [minWeight, setMinWeight] = useState(initial.minWeight ?? facets.weightRange.min);
  const [maxWeight, setMaxWeight] = useState(initial.maxWeight ?? facets.weightRange.max);
  const [players, setPlayers] = useState<number | "">(
    initial.minPlayers ?? initial.maxPlayers ?? ""
  );
  const [maxTime, setMaxTime] = useState<number | "">(initial.maxTime ?? "");
  const [cats, setCats] = useState<Set<string>>(new Set(initial.categories ?? []));
  const [mechs, setMechs] = useState<Set<string>>(new Set(initial.mechanics ?? []));
  const [sort, setSort] = useState<FiltersT["sort"]>(initial.sort);

  function apply(overrides?: {
    cats?: Set<string>;
    mechs?: Set<string>;
    players?: number | "";
    maxTime?: number | "";
  }) {
    const effectiveCats = overrides?.cats ?? cats;
    const effectiveMechs = overrides?.mechs ?? mechs;
    const effectivePlayers = overrides?.players !== undefined ? overrides.players : players;
    const effectiveMaxTime = overrides?.maxTime !== undefined ? overrides.maxTime : maxTime;

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (minWeight !== facets.weightRange.min) params.set("minWeight", String(minWeight));
    if (maxWeight !== facets.weightRange.max) params.set("maxWeight", String(maxWeight));
    if (effectivePlayers !== "") {
      params.set("minPlayers", String(effectivePlayers));
      params.set("maxPlayers", String(effectivePlayers));
    }
    if (effectiveMaxTime !== "") params.set("maxTime", String(effectiveMaxTime));
    if (effectiveCats.size) params.set("cat", [...effectiveCats].join(","));
    if (effectiveMechs.size) params.set("mech", [...effectiveMechs].join(","));
    if (sort !== "bayes") params.set("sort", String(sort));
    startTransition(() => router.push(`/?${params.toString()}`));
  }

  // Apply on debounced search-text change
  useEffect(() => {
    const t = setTimeout(() => apply(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSuggestions(data);
        setShowSugg(true);
      } catch { /* ignore */ }
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSugg(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-5 sticky top-20">
      <div ref={searchRef} className="relative">
        <label className="text-xs uppercase tracking-wider text-ink-faint">
          Search
        </label>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setShowSugg(true); }}
          onFocus={() => suggestions.length > 0 && setShowSugg(true)}
          placeholder="Wingspan, Catan…"
          className="mt-1 w-full rounded-lg bg-bg-soft border border-white/5 px-3 py-2 text-sm focus:outline-none focus:border-accent/60"
        />
        {showSugg && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-bg-soft shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <li key={s.bggId}>
                <a
                  href={`/games/${s.bggId}`}
                  className="flex items-baseline justify-between px-3 py-2 text-sm hover:bg-white/5"
                  onClick={() => setShowSugg(false)}
                >
                  <span>{s.name}</span>
                  {s.year && <span className="text-xs text-ink-faint ml-2 shrink-0">{s.year}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FilterBlock title="Sort">
        <select
          value={sort}
          onChange={(e) => {
            const v = e.target.value as FiltersT["sort"];
            setSort(v);
            // Apply immediately
            const params = new URLSearchParams(sp.toString());
            v === "bayes" ? params.delete("sort") : params.set("sort", v);
            startTransition(() => router.push(`/?${params.toString()}`));
          }}
          className="w-full rounded-lg bg-bg-soft border border-white/5 px-3 py-2 text-sm"
        >
          <option value="bayes">Bayesian rating</option>
          <option value="consensus">Consensus (low variance first)</option>
          <option value="weight">Weight (light → heavy)</option>
          <option value="year">Year (newest first)</option>
          <option value="year-asc">Year (oldest first)</option>
        </select>
      </FilterBlock>

      <FilterBlock title="Weight">
        <div className="flex items-center gap-2 text-xs text-ink-dim">
          <span className="w-6 text-right">{minWeight.toFixed(1)}</span>
          <input
            type="range"
            min={facets.weightRange.min}
            max={facets.weightRange.max}
            step={0.1}
            value={minWeight}
            onChange={(e) => setMinWeight(Number(e.target.value))}
            onMouseUp={() => apply()}
            onTouchEnd={() => apply()}
            className="flex-1 accent-accent"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-dim">
          <span className="w-6 text-right">{maxWeight.toFixed(1)}</span>
          <input
            type="range"
            min={facets.weightRange.min}
            max={facets.weightRange.max}
            step={0.1}
            value={maxWeight}
            onChange={(e) => setMaxWeight(Number(e.target.value))}
            onMouseUp={() => apply()}
            onTouchEnd={() => apply()}
            className="flex-1 accent-accent"
          />
        </div>
        <p className="text-xs text-ink-faint mt-1">
          1.0 = light · 5.0 = heavy
        </p>
      </FilterBlock>

      <FilterBlock title="Players (exact)">
        <div className="flex gap-1.5 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                const next = players === n ? "" : n;
                setPlayers(next);
                apply({ players: next });
              }}
              className={cn(
                "px-2.5 py-1 rounded-md text-sm border",
                players === n
                  ? "bg-accent text-bg border-accent"
                  : "bg-bg-soft border-white/5 text-ink-dim hover:border-accent/40"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Max playtime (min)">
        <div className="flex gap-1.5 flex-wrap">
          {[30, 45, 60, 90, 120, 180].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                const next = maxTime === n ? "" : n;
                setMaxTime(next);
                apply({ maxTime: next });
              }}
              className={cn(
                "px-2.5 py-1 rounded-md text-sm border",
                maxTime === n
                  ? "bg-accent text-bg border-accent"
                  : "bg-bg-soft border-white/5 text-ink-dim hover:border-accent/40"
              )}
            >
              ≤{n}
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Categories">
        <ChipList
          items={facets.categories}
          selected={cats}
          onToggle={(name) => {
            const next = new Set(cats);
            next.has(name) ? next.delete(name) : next.add(name);
            setCats(next);
            apply({ cats: next });
          }}
        />
      </FilterBlock>

      <FilterBlock title="Mechanics">
        <ChipList
          items={facets.mechanics}
          selected={mechs}
          onToggle={(name) => {
            const next = new Set(mechs);
            next.has(name) ? next.delete(name) : next.add(name);
            setMechs(next);
            apply({ mechs: next });
          }}
        />
      </FilterBlock>

      <button
        onClick={() => {
          startTransition(() => router.push("/"));
        }}
        className="text-xs text-ink-dim hover:text-ink"
      >
        Reset all filters
      </button>
    </div>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-ink-faint mb-1.5">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ChipList({
  items,
  selected,
  onToggle,
}: {
  items: { name: string; count: number }[];
  selected: Set<string>;
  onToggle: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-auto pr-1">
      {items.map(({ name, count }) => (
        <button
          key={name}
          onClick={() => onToggle(name)}
          className={cn(
            "px-2 py-0.5 rounded-full text-xs border transition-colors",
            selected.has(name)
              ? "bg-accent text-bg border-accent"
              : "bg-bg border-white/10 text-ink hover:border-accent/50 hover:text-ink"
          )}
        >
          {name}
          <span className="ml-1 text-[10px] text-ink-dim">{count}</span>
        </button>
      ))}
    </div>
  );
}
