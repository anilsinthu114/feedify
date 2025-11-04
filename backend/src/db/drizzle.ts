import { drizzle } from "drizzle-orm/sql-js";
import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";

const dbPath = path.resolve("src/db/feedback.db");

export const initDb = async () => {
  const SQL = await initSqlJs();

  let fileBuffer: Uint8Array | undefined;
  if (fs.existsSync(dbPath)) {
    fileBuffer = fs.readFileSync(dbPath);
  }

  const SQLdb = new SQL.Database(fileBuffer);
  const db = drizzle(SQLdb);

  // 🧩 Auto-save DB on exit
  process.on("exit", () => {
    const data = SQLdb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  });

  console.log("🗄️ SQLite database initialized (sql.js) ✅");
  return db;
};
