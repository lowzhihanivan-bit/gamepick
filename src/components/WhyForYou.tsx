"use client";

import { useEffect, useState } from "react";
import { loadSession } from "@/lib/session";
import { loadPreferences, matchReasons } from "@/lib/preferences";
import type { Preferences } from "@/lib/types";

export function WhyForYou(props: {
  weight: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  maxPlaytime: number | null;
  categories: string[];
  mechanics: string[];
}) {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const session = loadSession();
    const saved = loadPreferences();

    const merged: Preferences = {
      ...saved,
      preferredPlayers: session.players ?? saved.preferredPlayers,
      preferredTimeMax: session.maxTime ?? saved.preferredTimeMax,
      preferredWeightMin:
        session.weightBand === "medium"
          ? 2.0
          : session.weightBand === "heavy"
          ? 3.5
          : saved.preferredWeightMin,
      preferredWeightMax:
        session.weightBand === "light"
          ? 2.0
          : session.weightBand === "medium"
          ? 3.5
          : saved.preferredWeightMax,
    };

    const anySession =
      session.players != null ||
      session.maxTime != null ||
      session.weightBand != null;

    setHasSession(anySession);
    setPrefs(merged);
  }, []);

  if (!prefs) return null;

  const hasAnyPref =
    prefs.preferredWeightMin != null ||
    prefs.preferredWeightMax != null ||
    prefs.preferredPlayers != null ||
    prefs.preferredTimeMax != null ||
    prefs.likedMechanics.length > 0 ||
    prefs.dislikedMechanics.length > 0 ||
    prefs.likedCategories.length > 0 ||
    prefs.dislikedCategories.length > 0;

  if (!hasAnyPref) {
    return (
      <section className="mt-6 rounded-xl border border-dashed border-white/10 p-4">
        <h2 className="text-sm uppercase tracking-wider text-ink-faint mb-1">
          Why this might be for you
        </h2>
        <p className="text-sm text-ink-dim">
          Set up your session on the{" "}
          <a href="/" className="text-accent hover:underline">
            home page
          </a>{" "}
          and we&apos;ll explain how each game fits.
        </p>
      </section>
    );
  }

  const { positive, negative, score } = matchReasons(props, prefs);

  const verdict =
    score >= 4
      ? { label: "Strong fit", tone: "ok" as const }
      : score >= 1
      ? { label: "Probably for you", tone: "ok" as const }
      : score >= -1
      ? { label: "Mixed fit", tone: "warn" as const }
      : { label: "Probably not for you", tone: "bad" as const };

  return (
    <section className="mt-6 rounded-xl border border-white/5 bg-bg-soft p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-wider text-ink-faint">
          Why this might be for you
        </h2>
        <span
          className={
            verdict.tone === "ok"
              ? "text-xs text-ok"
              : verdict.tone === "warn"
              ? "text-xs text-warn"
              : "text-xs text-bad"
          }
        >
          {verdict.label}
        </span>
      </div>

      {positive.length === 0 && negative.length === 0 ? (
        <p className="mt-2 text-sm text-ink-dim">
          Nothing in your session matched here either way.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ul className="space-y-1.5 text-sm">
            {positive.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-ok">+</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-1.5 text-sm">
            {negative.map((n) => (
              <li key={n} className="flex gap-2">
                <span className="text-bad">−</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!hasSession && (
        <div className="mt-3">
          <a href="/" className="text-xs text-ink-dim hover:text-accent">
            Update your session →
          </a>
        </div>
      )}
    </section>
  );
}
