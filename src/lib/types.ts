export type SortKey = "bayes" | "consensus" | "weight" | "year";

export type Filters = {
  q?: string;
  minWeight?: number;
  maxWeight?: number;
  minPlayers?: number;
  maxPlayers?: number;
  minTime?: number;
  maxTime?: number;
  categories?: string[];
  mechanics?: string[];
  mood?: string;
  sort: SortKey;
  page: number;
};

export type GameRow = {
  id: number;
  bggId: number;
  name: string;
  yearPublished: number | null;
  thumbnail: string | null;
  image: string | null;
  description: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  minAge: number | null;
  weight: number | null;
  bggRank: number | null;
  rawAvg: number | null;
  numRatings: number | null;
  bayesAvg: number | null;
  consensus: number | null;
  cohortLabel: string | null;
  cohortPercentile: number | null;
  categoriesJson: string | null;
  mechanicsJson: string | null;
  histogramJson: string | null;
  strengthsJson: string | null;
  weaknessesJson: string | null;
};

export type Facets = {
  categories: { name: string; count: number }[];
  mechanics: { name: string; count: number }[];
  weightRange: { min: number; max: number };
};

export type Preferences = {
  preferredWeightMin?: number;
  preferredWeightMax?: number;
  preferredPlayers?: number;
  preferredTimeMax?: number;
  likedMechanics: string[];
  dislikedMechanics: string[];
  likedCategories: string[];
  dislikedCategories: string[];
};
