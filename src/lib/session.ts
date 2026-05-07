"use client";

export type WeightBand = "light" | "medium" | "heavy";

export type Session = {
  players?: number;
  maxTime?: number;
  weightBand?: WeightBand;
};

const KEY = "gamepick.session.v1";

export function loadSession(): Session {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : {};
  } catch {
    return {};
  }
}

export function saveSession(s: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export const BAND_PARAMS: Record<WeightBand, { min?: number; max?: number }> = {
  light:  { max: 2.0 },
  medium: { min: 2.0, max: 3.5 },
  heavy:  { min: 3.5 },
};

export function bandFromParams(minWeight?: number, maxWeight?: number): WeightBand | undefined {
  if (maxWeight != null && maxWeight <= 2.0 && minWeight == null) return "light";
  if (minWeight != null && minWeight >= 2.0 && maxWeight != null && maxWeight <= 3.5) return "medium";
  if (minWeight != null && minWeight >= 3.5 && maxWeight == null) return "heavy";
  return undefined;
}
