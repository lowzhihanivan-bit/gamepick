"use client";

import { useEffect, useState } from "react";
type BggImage = { url: string; thumbnail: string };

export function GameImageGallery({
  bggId,
  mainImage,
}: {
  bggId: number;
  mainImage: string | null;
}) {
  const [images, setImages] = useState<BggImage[]>([]);
  const [selected, setSelected] = useState<string | null>(mainImage);

  useEffect(() => {
    fetch(`/api/bgg-images/${bggId}`)
      .then((r) => r.json())
      .then((data) => setImages(data as BggImage[]))
      .catch(() => {});
  }, [bggId]);

  // All images: version photos + main image as fallback
  const allImages: BggImage[] = [
    ...(mainImage ? [{ url: mainImage, thumbnail: mainImage }] : []),
    ...images.filter((img) => img.url !== mainImage),
  ];

  return (
    <div>
      {/* Main display */}
      <div className="aspect-square rounded-2xl overflow-hidden bg-bg-soft border border-white/5">
        {selected ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected} alt="Game photo" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint text-xs">
            No image
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.thumbnail}
              alt={`Photo ${i + 1}`}
              onClick={() => setSelected(img.url)}
              className={`w-16 h-16 rounded-lg object-cover cursor-pointer shrink-0 border-2 transition-colors ${
                selected === img.url ? "border-accent" : "border-white/10 hover:border-white/30"
              }`}
            />
          ))}
          <a
            href={`https://boardgamegeek.com/boardgame/${bggId}/images`}
            target="_blank"
            rel="noopener"
            className="w-16 h-16 rounded-lg bg-bg-soft border border-white/10 flex items-center justify-center shrink-0 hover:border-accent/40 transition-colors"
            title="More photos on BGG"
          >
            <span className="text-[10px] text-ink-faint text-center leading-tight px-1">More on BGG ↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
