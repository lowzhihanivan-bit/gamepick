import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { unstable_cache } from "next/cache";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

type BggImage = { url: string; thumbnail: string };

async function _fetchImages(bggId: string): Promise<BggImage[]> {
  const headers: Record<string, string> = { "User-Agent": "GamePick/1.0" };
  const token = process.env.BGG_BEARER_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // BGG's image gallery endpoint
  const res = await fetch(
    `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&versions=1`,
    { headers, next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];

  const text = await res.text();
  if (!text.includes("<items")) return [];

  const data = parser.parse(text);
  const item = data?.items?.item;
  if (!item) return [];

  // Collect images from versions
  const images: BggImage[] = [];
  const versions = item.versions?.item;
  if (versions) {
    const arr = Array.isArray(versions) ? versions : [versions];
    for (const v of arr) {
      if (v.image && typeof v.image === "string" && v.image.startsWith("http")) {
        const thumb = v.thumbnail && typeof v.thumbnail === "string" ? v.thumbnail : v.image;
        images.push({ url: v.image, thumbnail: thumb });
      }
    }
  }

  return images.slice(0, 12);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bggId: string }> }
) {
  const { bggId } = await params;
  const cached = unstable_cache(_fetchImages, [`bgg-images-${bggId}`], {
    revalidate: 86400,
  });
  try {
    const images = await cached(bggId);
    return NextResponse.json(images);
  } catch {
    return NextResponse.json([]);
  }
}
