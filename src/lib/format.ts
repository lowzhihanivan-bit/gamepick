export function fmtPlayers(min: number | null, max: number | null) {
  if (min == null && max == null) return "—";
  if (min === max || max == null) return `${min}`;
  if (min == null) return `up to ${max}`;
  return `${min}–${max}`;
}

export function fmtTime(min: number | null, max: number | null) {
  if (min == null && max == null) return "—";
  if (min === max || max == null) return `${min} min`;
  if (min == null) return `up to ${max} min`;
  return `${min}–${max} min`;
}

export function weightLabel(w: number | null) {
  if (w == null) return "?";
  if (w < 1.5) return "Light";
  if (w < 2.5) return "Medium-light";
  if (w < 3.5) return "Medium-heavy";
  return "Heavy";
}

export function consensusLabel(c: number | null) {
  if (c == null) return { label: "—", tone: "ink-dim" as const };
  if (c < 1.4) return { label: "Strong consensus", tone: "ok" as const };
  if (c < 1.8) return { label: "Mostly agree", tone: "ok" as const };
  if (c < 2.2) return { label: "Mixed", tone: "warn" as const };
  return { label: "Polarising", tone: "bad" as const };
}

export function confidenceFromVotes(n: number | null) {
  if (n == null || n <= 0) return { label: "Very low", tone: "bad" as const, pct: 0 };
  if (n < 100) return { label: "Very low", tone: "bad" as const, pct: 0.1 };
  if (n < 500) return { label: "Low", tone: "warn" as const, pct: 0.3 };
  if (n < 2000) return { label: "Moderate", tone: "warn" as const, pct: 0.55 };
  if (n < 10000) return { label: "High", tone: "ok" as const, pct: 0.8 };
  return { label: "Very high", tone: "ok" as const, pct: 1 };
}
