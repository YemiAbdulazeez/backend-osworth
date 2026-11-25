import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
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

/**
 * Columns added after a table was first created. CREATE TABLE IF NOT EXISTS
 * skips existing tables, and MySQL has no ADD COLUMN IF NOT EXISTS.
 */
const ADDED_COLUMNS = [
  { table: "site_settings", column: "ecommerce_enabled", definition: "TINYINT(1) NOT NULL DEFAULT 0 AFTER seo_description" },
  {
    table: "users",
    column: "status",
    definition: "ENUM('active','suspended') NOT NULL DEFAULT 'active' AFTER role",
  },
];

async function ensureColumn(conn: PoolConnection, table: string, column: string, definition: string) {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column],
  );
  if (rows.length > 0) return;
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`Added ${table}.${column}`);
}

function explainDbError(error: unknown): never {
  const err = error as NodeJS.ErrnoException & { hostname?: string; code?: string };
  const code = err.code ?? "UNKNOWN";
  if (code === "ENOTFOUND") {
    console.error(`\nDatabase host could not be resolved (ENOTFOUND): ${err.hostname ?? "(unknown)"}`);
    console.error("Update DATABASE_URL on Render to a live MySQL 8 host.");
    console.error("If you used Aiven, open the Aiven console and copy the current Service URI —");
    console.error("deleted or renamed services keep the old hostname in env vars and will fail like this.\n");
  } else if (code === "ECONNREFUSED" || code === "ETIMEDOUT") {
    console.error(`\nCould not reach MySQL (${code}). Check host, port, firewall, and that the instance is running.\n`);
  } else {
    console.error("\nMigration failed while connecting to MySQL:");
    console.error(error);
  }
  process.exit(1);
}

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), "sql");
const files = fs.readdirSync(directory).filter((file) => file.endsWith(".sql")).sort();

let conn: PoolConnection;
try {
  conn = await pool.getConnection();
} catch (error) {
  explainDbError(error);
}

try {
  for (const file of files) {
    const sql = fs.readFileSync(path.join(directory, file), "utf8");
    for (const statement of statements(sql)) {
      await conn.query(statement);
    }
    console.log(`Applied ${file}`);
  }
  for (const { table, column, definition } of ADDED_COLUMNS) {
    await ensureColumn(conn, table, column, definition);
  }
} finally {
  conn.release();
  await pool.end();
}
