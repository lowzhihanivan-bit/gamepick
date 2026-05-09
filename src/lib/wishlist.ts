"use client";

import { useState, useEffect } from "react";

const KEY = "gamepick.wishlist.v1";

export function useWishlist() {
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setIds(new Set(JSON.parse(stored) as number[]));
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  function toggle(bggId: number) {
    setIds((prev) => {
      const next = new Set(prev);
      next.has(bggId) ? next.delete(bggId) : next.add(bggId);
      try { localStorage.setItem(KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  function isStarred(bggId: number) {
    return ids.has(bggId);
  }

  function getIds(): number[] {
    try {
      const stored = localStorage.getItem(KEY);
      return stored ? (JSON.parse(stored) as number[]) : [];
    } catch { return []; }
  }

  return { ids, toggle, isStarred, ready, getIds };
}
