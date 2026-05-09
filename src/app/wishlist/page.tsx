"use client";

import { useEffect, useState } from "react";
import { GameCard } from "@/components/GameCard";
import type { GameRow } from "@/lib/types";

const KEY = "gamepick.wishlist.v1";

export default function WishlistPage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stored = localStorage.getItem(KEY);
        const ids: number[] = stored ? JSON.parse(stored) : [];
        if (!ids.length) { setLoading(false); return; }
        const res = await fetch(`/api/games?ids=${ids.join(",")}`);
        const data = await res.json();
        setGames(data as GameRow[]);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  // Re-sync when a star is toggled (storage event fires in same tab via custom event)
  useEffect(() => {
    function onStorage() {
      const stored = localStorage.getItem(KEY);
      const ids: number[] = stored ? JSON.parse(stored) : [];
      if (!ids.length) { setGames([]); return; }
      fetch(`/api/games?ids=${ids.join(",")}`)
        .then((r) => r.json())
        .then((data) => setGames(data as GameRow[]))
        .catch(() => {});
    }
    window.addEventListener("gamepick:wishlist", onStorage);
    return () => window.removeEventListener("gamepick:wishlist", onStorage);
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">My Wishlist</h1>
        <p className="text-sm text-ink-dim">
          Games you&apos;ve starred — saved privately in this browser.
        </p>
      </div>

      {loading ? (
        <p className="text-ink-dim text-sm">Loading…</p>
      ) : games.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-bg-soft p-10 text-center">
          <p className="text-lg">No saved games yet.</p>
          <p className="text-ink-dim text-sm mt-2">
            Click the ☆ on any game card to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
