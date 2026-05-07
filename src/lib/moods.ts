export type MoodId =
  | "quick"
  | "deep"
  | "family"
  | "party"
  | "coop"
  | "competitive"
  | "epic"
  | "gems";

export const MOODS: {
  id: MoodId;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  {
    id: "quick",
    label: "Quick Game",
    emoji: "⚡",
    desc: "Under 45 min, easy to learn",
  },
  {
    id: "deep",
    label: "Brain Burner",
    emoji: "🧠",
    desc: "Complex strategy, heavy thinking",
  },
  {
    id: "family",
    label: "Family Night",
    emoji: "👨‍👩‍👧",
    desc: "Kid-friendly, approachable",
  },
  {
    id: "party",
    label: "Party Time",
    emoji: "🎉",
    desc: "Social, loud, lots of players",
  },
  {
    id: "coop",
    label: "Work Together",
    emoji: "🤝",
    desc: "Team up against the game",
  },
  {
    id: "competitive",
    label: "Head to Head",
    emoji: "⚔️",
    desc: "Competitive, strategic",
  },
  {
    id: "epic",
    label: "Epic Session",
    emoji: "🌙",
    desc: "Long, immersive experience",
  },
  {
    id: "gems",
    label: "Hidden Gems",
    emoji: "💎",
    desc: "Highly rated, not in BGG top 100",
  },
];

export const MOOD_MAP = new Map(MOODS.map((m) => [m.id, m]));

/** Returns a SQL fragment (no leading AND) + named params for a given mood. */
export function moodToSql(mood: string): {
  sql: string;
  params: Record<string, string | number>;
} | null {
  switch (mood as MoodId) {
    case "quick":
      return {
        sql: "(max_playtime IS NULL OR max_playtime <= 45) AND (weight IS NULL OR weight <= 2.5)",
        params: {},
      };
    case "deep":
      return {
        sql: "weight >= 3.5",
        params: {},
      };
    case "family":
      return {
        sql: "(weight IS NULL OR weight <= 2.0) AND (max_playtime IS NULL OR max_playtime <= 75) AND (min_age IS NULL OR min_age <= 10)",
        params: {},
      };
    case "party":
      return {
        sql: "(categories_json LIKE '%Party Game%' OR (max_players IS NOT NULL AND max_players >= 5))",
        params: {},
      };
    case "coop":
      return {
        sql: "mechanics_json LIKE '%Cooperative Game%'",
        params: {},
      };
    case "competitive":
      return {
        sql: "weight >= 2.0 AND (mechanics_json IS NULL OR mechanics_json NOT LIKE '%Cooperative Game%')",
        params: {},
      };
    case "epic":
      return {
        sql: "(min_playtime >= 90 OR max_playtime >= 120)",
        params: {},
      };
    case "gems":
      return {
        sql: "bayes_avg >= 7.0 AND (bgg_rank IS NULL OR bgg_rank > 100)",
        params: {},
      };
    default:
      return null;
  }
}
