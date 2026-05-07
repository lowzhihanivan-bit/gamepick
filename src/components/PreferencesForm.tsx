"use client";

import { useEffect, useState } from "react";
import { loadPreferences, savePreferences, defaultPreferences } from "@/lib/preferences";
import type { Facets, Preferences } from "@/lib/types";
import { cn } from "@/lib/cn";

export function PreferencesForm({ facets }: { facets: Facets }) {
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  function update<K extends keyof Preferences>(k: K, v: Preferences[K]) {
    setPrefs((p) => {
      const next = { ...p, [k]: v };
      savePreferences(next);
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  function toggleList(k: "likedMechanics" | "dislikedMechanics" | "likedCategories" | "dislikedCategories", v: string) {
    setPrefs((p) => {
      const list = p[k];
      const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
      const updated = { ...p, [k]: next };
      savePreferences(updated);
      return updated;
    });
  }

  function reset() {
    savePreferences(defaultPreferences);
    setPrefs(defaultPreferences);
  }

  return (
    <div className="space-y-8">
      <Section title="Complexity (weight)" subtitle="What range of rules-heaviness do you enjoy?">
        <div className="flex items-center gap-4">
          <NumberPick
            label="Min"
            value={prefs.preferredWeightMin}
            options={[undefined, 1, 1.5, 2, 2.5, 3, 3.5, 4]}
            onChange={(v) => update("preferredWeightMin", v)}
            fmt={(v) => (v == null ? "any" : v.toFixed(1))}
          />
          <NumberPick
            label="Max"
            value={prefs.preferredWeightMax}
            options={[undefined, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]}
            onChange={(v) => update("preferredWeightMax", v)}
            fmt={(v) => (v == null ? "any" : v.toFixed(1))}
          />
        </div>
      </Section>

      <Section title="Player count" subtitle="What count are you usually playing at?">
        <div className="flex flex-wrap gap-1.5">
          {[undefined, 1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={String(n)}
              type="button"
              onClick={() => update("preferredPlayers", n)}
              className={cn(
                "px-3 py-1 rounded-md text-sm border",
                prefs.preferredPlayers === n
                  ? "bg-accent text-bg border-accent"
                  : "bg-bg-soft border-black/8 hover:border-accent/40"
              )}
            >
              {n == null ? "any" : `${n} players`}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Time budget" subtitle="What's the longest session you usually want?">
        <div className="flex flex-wrap gap-1.5">
          {[undefined, 30, 45, 60, 90, 120, 180].map((t) => (
            <button
              key={String(t)}
              type="button"
              onClick={() => update("preferredTimeMax", t)}
              className={cn(
                "px-3 py-1 rounded-md text-sm border",
                prefs.preferredTimeMax === t
                  ? "bg-accent text-bg border-accent"
                  : "bg-bg-soft border-black/8 hover:border-accent/40"
              )}
            >
              {t == null ? "any" : `≤${t} min`}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Mechanics you like" subtitle="Boost games with any of these">
        <ChipPicker items={facets.mechanics} selected={prefs.likedMechanics}
          onToggle={(v) => toggleList("likedMechanics", v)} tone="like" />
      </Section>

      <Section title="Mechanics you dislike" subtitle="Penalise games with any of these">
        <ChipPicker items={facets.mechanics} selected={prefs.dislikedMechanics}
          onToggle={(v) => toggleList("dislikedMechanics", v)} tone="dislike" />
      </Section>

      <Section title="Categories you like">
        <ChipPicker items={facets.categories} selected={prefs.likedCategories}
          onToggle={(v) => toggleList("likedCategories", v)} tone="like" />
      </Section>

      <Section title="Categories you dislike">
        <ChipPicker items={facets.categories} selected={prefs.dislikedCategories}
          onToggle={(v) => toggleList("dislikedCategories", v)} tone="dislike" />
      </Section>

      <div className="flex items-center justify-between pt-4 border-t border-black/8">
        <span className="text-xs text-ink-faint">
          {saved ? "Saved" : "Saved automatically as you change."}
        </span>
        <button onClick={reset} className="text-xs text-ink-dim hover:text-bad">
          Reset all preferences
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="font-medium">{title}</h3>
      {subtitle ? <p className="text-xs text-ink-dim mt-0.5">{subtitle}</p> : null}
      <div className="mt-2">{children}</div>
    </section>
  );
}

function NumberPick({
  label,
  value,
  options,
  onChange,
  fmt,
}: {
  label: string;
  value: number | undefined;
  options: (number | undefined)[];
  onChange: (v: number | undefined) => void;
  fmt: (v: number | undefined) => string;
}) {
  return (
    <label className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</span>
      <select
        value={value == null ? "" : String(value)}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
        className="mt-1 rounded-md bg-bg-soft border border-black/8 px-2 py-1 text-sm"
      >
        {options.map((v) => (
          <option key={String(v)} value={v == null ? "" : String(v)}>
            {fmt(v)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChipPicker({
  items,
  selected,
  onToggle,
  tone,
}: {
  items: { name: string; count: number }[];
  selected: string[];
  onToggle: (v: string) => void;
  tone: "like" | "dislike";
}) {
  return (
    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-auto pr-1">
      {items.map(({ name, count }) => {
        const on = selected.includes(name);
        return (
          <button
            key={name}
            onClick={() => onToggle(name)}
            className={cn(
              "px-2 py-0.5 rounded-full text-xs border",
              on
                ? tone === "like"
                  ? "bg-ok/20 border-ok/60 text-ok"
                  : "bg-bad/20 border-bad/60 text-bad"
                : "bg-bg-soft border-black/8 text-ink-dim hover:border-accent/40"
            )}
          >
            {name} <span className="opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
