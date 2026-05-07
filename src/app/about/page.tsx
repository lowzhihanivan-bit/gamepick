export default function About() {
  return (
    <article className="prose prose-invert max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">About this site</h1>
      <p className="text-ink-dim mt-3 text-sm">
        GamePick is a board-game discovery tool focused on helping you find the
        right game rather than just the highest-ranked one.
      </p>

      <h2 className="text-lg mt-6">How ratings work</h2>
      <p className="text-sm text-ink-dim leading-relaxed mt-2">
        Each game gets a <em>Bayesian-weighted score</em> rather than a raw average —
        a game rated 9.5 by 20 people ranks below one rated 8.2 by 50,000, because
        volume of votes is what makes a rating trustworthy. Games with few ratings
        are pulled toward the catalog average until they earn enough votes to prove themselves.
      </p>

      <h2 className="text-lg mt-6">Player consensus</h2>
      <p className="text-sm text-ink-dim leading-relaxed mt-2">
        We compute the standard deviation of player ratings. Tight spread =
        strong consensus; wide spread = polarising. A polarising game isn't bad —
        it just means it really clicks for some and falls flat for others, so the
        average alone is misleading.
      </p>

      <h2 className="text-lg mt-6">Cohort comparison (vs BGG bias)</h2>
      <p className="text-sm text-ink-dim leading-relaxed mt-2">
        BGG's user base skews toward heavier strategy games, so a light family
        game's overall rank looks worse than it deserves. We bucket games by
        complexity and show how each one ranks <em>within</em> its cohort, so a
        great family game isn't punished for being approachable.
      </p>

      <h2 className="text-lg mt-6">No critic reviews</h2>
      <p className="text-sm text-ink-dim leading-relaxed mt-2">
        We deliberately don't aggregate critic/reviewer scores — accepting paid
        reviews is too common and we'd rather not introduce that bias. Strengths
        and weaknesses are derived from objective attributes (weight, length,
        mechanics, category, consensus).
      </p>

      <h2 className="text-lg mt-6">Data source</h2>
      <p className="text-sm text-ink-dim leading-relaxed mt-2">
        Game catalog and base ratings come from Recommend.Games, which sources
        data from BoardGameGeek. Computed metrics and matching are local to this site.
      </p>
    </article>
  );
}
