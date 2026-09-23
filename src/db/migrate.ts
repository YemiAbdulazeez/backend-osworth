import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

function statements(sql: string): string[] {
  const withoutComments = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  return withoutComments
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), "sql");
const files = fs.readdirSync(directory).filter((file) => file.endsWith(".sql")).sort();
const conn = await pool.getConnection();

try {
  for (const file of files) {
    const sql = fs.readFileSync(path.join(directory, file), "utf8");
    for (const statement of statements(sql)) {
      await conn.query(statement);
    }
    console.log(`Applied ${file}`);
  }
} finally {
  conn.release();
  await pool.end();
}
