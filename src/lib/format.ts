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
  if (c == null) return { label: "—", tooltip: "", tone: "ink-dim" as const };
  if (c < 1.4) return { label: "Everyone agrees", tooltip: "Players almost unanimously rate this the same way", tone: "ok" as const };
  if (c < 1.8) return { label: "Mostly agree", tooltip: "Most players feel similarly about this game", tone: "ok" as const };
  if (c < 2.2) return { label: "Opinions split", tooltip: "Some love it, some don't — check reviews before buying", tone: "warn" as const };
  return { label: "Love it or hate it", tooltip: "Players are sharply divided — the average rating can be misleading", tone: "bad" as const };
}

export function confidenceFromVotes(n: number | null) {
  if (n == null || n <= 0) return { label: "Too few ratings", tooltip: "Not enough data yet", tone: "bad" as const, pct: 0 };
  if (n < 100) return { label: "Too few ratings", tooltip: "Only a handful of people have rated this", tone: "bad" as const, pct: 0.1 };
  if (n < 500) return { label: "Early ratings", tooltip: "Still building up reviews — take with a pinch of salt", tone: "warn" as const, pct: 0.3 };
  if (n < 2000) return { label: "Decent sample", tooltip: "Enough ratings to be fairly reliable", tone: "warn" as const, pct: 0.55 };
  if (n < 10000) return { label: "Well rated", tooltip: "Lots of ratings — this score is trustworthy", tone: "ok" as const, pct: 0.8 };
  return { label: "Highly trusted", tooltip: "Thousands of ratings — very reliable score", tone: "ok" as const, pct: 1 };
}
