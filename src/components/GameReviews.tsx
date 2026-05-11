"use client";

import { useEffect, useState } from "react";
import type { Review } from "@/app/api/bgg-reviews/[bggId]/route";

export function GameReviews({ bggId }: { bggId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bgg-reviews/${bggId}`)
      .then((r) => r.json())
      .then((data) => setReviews(data as Review[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bggId]);

  if (loading) {
    return <p className="text-ink-faint text-sm animate-pulse">Loading reviews…</p>;
  }

  if (!reviews.length) {
    return (
      <p className="text-ink-faint text-sm">
        No reviews available.{" "}
        <a
          href={`https://boardgamegeek.com/boardgame/${bggId}/ratings?comment=1`}
          target="_blank"
          rel="noopener"
          className="text-accent hover:underline"
        >
          Read reviews on BGG ↗
        </a>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r, i) => (
        <div key={i} className="rounded-xl border border-white/5 bg-bg-soft p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{r.username}</span>
            {r.rating != null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono">
                {r.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-sm text-ink-dim leading-relaxed line-clamp-6">{r.text}</p>
        </div>
      ))}
      <a
        href={`https://boardgamegeek.com/boardgame/${bggId}/ratings?comment=1`}
        target="_blank"
        rel="noopener"
        className="block text-xs text-ink-faint hover:text-accent text-center pt-2"
      >
        See all reviews on BGG ↗
      </a>
    </div>
  );
}
