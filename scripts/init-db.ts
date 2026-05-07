import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { CREATE_GAMES_SQL } from "../src/db/schema";

const dbPath = path.join(process.cwd(), "data", "boardgames.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec(CREATE_GAMES_SQL);
console.log(`✓ DB ready at ${dbPath}`);
db.close();
