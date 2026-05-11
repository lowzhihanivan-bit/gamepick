import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { unstable_cache } from "next/cache";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

export type Review = {
  username: string;
  rating: number | null;
  text: string;
};

async function _fetchReviews(bggId: string): Promise<Review[]> {
  const headers: Record<string, string> = {
    "User-Agent": "GamePick/1.0",
    Accept: "application/xml",
  };
  const token = process.env.BGG_BEARER_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&comments=1&pagesize=20&page=1`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];

  const text = await res.text();
  // BGG sometimes returns a "retry later" message
  if (!text.includes("<items")) return [];

  const data = parser.parse(text);
  const raw = data?.items?.item?.comments?.comment;
  if (!raw) return [];

  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .filter((c: Record<string, string>) => {
      const t = c["@_value"] ?? "";
      return typeof t === "string" && t.trim().length > 80;
    })
    .slice(0, 10)
    .map((c: Record<string, string>) => ({
      username: c["@_username"] ?? "Anonymous",
      rating: c["@_rating"] && c["@_rating"] !== "N/A" ? Number(c["@_rating"]) : null,
      text: (c["@_value"] ?? "").trim(),
    }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bggId: string }> }
) {
  const { bggId } = await params;
  const cached = unstable_cache(_fetchReviews, [`bgg-reviews-${bggId}`], {
    revalidate: 3600,
  });
  try {
    const reviews = await cached(bggId);
    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json([]);
  }
}
