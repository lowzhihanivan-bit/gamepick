"use client";

import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/cn";

export function WishlistButton({ bggId }: { bggId: number }) {
  const { isStarred, toggle, ready } = useWishlist();
  const starred = isStarred(bggId);

  if (!ready) return null;

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(bggId); }}
      title={starred ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-md text-base transition-colors",
        starred
          ? "bg-accent text-bg"
          : "bg-black/60 backdrop-blur text-white/70 hover:text-accent"
      )}
    >
      {starred ? "★" : "☆"}
    </button>
  );
}
