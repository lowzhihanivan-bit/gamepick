// Plain SQL schema — see scripts/init-db.ts.
// Kept here as a reference of the column types the app expects.

export const CREATE_GAMES_SQL = `
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bgg_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  year_published INTEGER,
  thumbnail TEXT,
  image TEXT,
  description TEXT,
  min_players INTEGER,
  max_players INTEGER,
  min_playtime INTEGER,
  max_playtime INTEGER,
  min_age INTEGER,
  weight REAL,
  bgg_rank INTEGER,
  raw_avg REAL,
  num_ratings INTEGER,
  bayes_avg REAL,
  consensus REAL,
  cohort_label TEXT,
  cohort_percentile REAL,
  categories_json TEXT,
  mechanics_json TEXT,
  histogram_json TEXT,
  strengths_json TEXT,
  weaknesses_json TEXT,
  fetched_at INTEGER
);

CREATE INDEX IF NOT EXISTS games_rank_idx   ON games(bgg_rank);
CREATE INDEX IF NOT EXISTS games_bayes_idx  ON games(bayes_avg);
CREATE INDEX IF NOT EXISTS games_weight_idx ON games(weight);
`;
