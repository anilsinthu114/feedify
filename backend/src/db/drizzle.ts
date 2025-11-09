import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import fs from "fs";
import path from "path";

// ✅ Use top-level data folder for persistence
const dataDir = path.resolve("data");
const dbPath = path.join(dataDir, "feedback.db");

export const initDb = async () => {
  // ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // open persistent database file
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  console.log(`🗄️ SQLite database ready at ${dbPath} ✅`);
  return db;
};

let cachedDb: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!cachedDb) cachedDb = await initDb();
  return cachedDb;
}
