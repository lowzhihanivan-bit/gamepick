import { createClient } from "@libsql/client";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof createClient> | undefined;
}

function makeClient() {
  const url =
    process.env.TURSO_DATABASE_URL ??
    `file:${path.join(process.cwd(), "data", "boardgames.sqlite").replace(/\\/g, "/")}`;
  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export const db =
  globalThis.__db ?? (globalThis.__db = makeClient());
