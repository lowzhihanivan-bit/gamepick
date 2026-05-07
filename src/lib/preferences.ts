"use client";

import type { Preferences } from "./types";

const KEY = "gamepick.prefs.v1";

export const defaultPreferences: Preferences = {
  preferredWeightMin: undefined,
  preferredWeightMax: undefined,
  preferredPlayers: undefined,
  preferredTimeMax: undefined,
  likedMechanics: [],
  dislikedMechanics: [],
  likedCategories: [],
  dislikedCategories: [],
};

export function loadPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...(JSON.parse(raw) as Preferences) };
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(p: Preferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

/**
 * Match a game's traits against user preferences and return reasons it might fit
 * (positive) or might not (negative). Pure function — no side effects.
 */
export function matchReasons(game: {
  weight: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  maxPlaytime: number | null;
  categories: string[];
  mechanics: string[];
}, p: Preferences): { positive: string[]; negative: string[]; score: number } {
  const positive: string[] = [];
  const negative: string[] = [];
  let score = 0;

  // Weight band
  if (p.preferredWeightMin != null || p.preferredWeightMax != null) {
    if (game.weight == null) {
      negative.push("No complexity rating yet — hard to tell if it fits your weight range");
    } else {
      const lo = p.preferredWeightMin ?? 0;
      const hi = p.preferredWeightMax ?? 5;
      if (game.weight >= lo && game.weight <= hi) {
        positive.push(`In your preferred complexity range (${game.weight.toFixed(1)})`);
        score += 2;
      } else if (game.weight < lo) {
        negative.push(`Lighter than you usually like (${game.weight.toFixed(1)} vs your floor ${lo.toFixed(1)})`);
        score -= 1;
      } else {
        negative.push(`Heavier than you usually like (${game.weight.toFixed(1)} vs your ceiling ${hi.toFixed(1)})`);
        score -= 2;
      }
    }
  }

  // Player count
  if (p.preferredPlayers != null) {
    const target = p.preferredPlayers;
    const lo = game.minPlayers ?? 1;
    const hi = game.maxPlayers ?? 99;
    if (target >= lo && target <= hi) {
      positive.push(`Plays at your preferred ${target} player count`);
      score += 2;
    } else {
      negative.push(`Doesn't support your preferred ${target} player count (game is ${lo}–${hi})`);
      score -= 3;
    }
  }

  // Playtime ceiling
  if (p.preferredTimeMax != null) {
    if (game.maxPlaytime != null && game.maxPlaytime <= p.preferredTimeMax) {
      positive.push(`Fits your time budget (≤${p.preferredTimeMax} min)`);
      score += 1;
    } else if (game.maxPlaytime != null && game.maxPlaytime > p.preferredTimeMax) {
      negative.push(`Longer than your usual session (up to ${game.maxPlaytime} min vs ≤${p.preferredTimeMax})`);
      score -= 2;
    }
  }

  // Liked/disliked tags
  for (const m of game.mechanics) {
    if (p.likedMechanics.includes(m)) {
      positive.push(`Has “${m}” — a mechanic you've flagged as liked`);
      score += 1;
    }
    if (p.dislikedMechanics.includes(m)) {
      negative.push(`Has “${m}” — a mechanic you've flagged as disliked`);
      score -= 2;
    }
  }
  for (const c of game.categories) {
    if (p.likedCategories.includes(c)) {
      positive.push(`Tagged “${c}” — a category you like`);
      score += 1;
    }
    if (p.dislikedCategories.includes(c)) {
      negative.push(`Tagged “${c}” — a category you dislike`);
      score -= 2;
    }
  }

  return { positive: dedupe(positive), negative: dedupe(negative), score };
}

function dedupe(xs: string[]) {
  return [...new Set(xs)];
}
