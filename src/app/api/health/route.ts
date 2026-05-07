import { NextResponse } from "next/server";
import { db } from "@/db/client";

export async function GET() {
  try {
    const result = await db.execute("SELECT COUNT(*) as c FROM games");
    return NextResponse.json({
      ok: true,
      count: result.rows[0],
      url: process.env.TURSO_DATABASE_URL?.slice(0, 40) + "...",
      hasToken: !!process.env.TURSO_AUTH_TOKEN,
      tokenLength: process.env.TURSO_AUTH_TOKEN?.length ?? 0,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: String(e),
        url: process.env.TURSO_DATABASE_URL?.slice(0, 40) + "...",
        hasToken: !!process.env.TURSO_AUTH_TOKEN,
        tokenLength: process.env.TURSO_AUTH_TOKEN?.length ?? 0,
      },
      { status: 500 }
    );
  }
}
