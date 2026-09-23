import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { HttpError } from "../lib/httpError.js";
import { uuid } from "../utils/ids.js";
import { pool } from "./pool.js";

export type SqlRow = RowDataPacket & Record<string, unknown>;

export type Db = {
  query: (sql: string, params?: unknown[]) => Promise<SqlRow[]>;
  exec: (sql: string, params?: unknown[]) => Promise<void>;
};

const TABLES = {
  users: "users",
  sessions: "sessions",
  categories: "categories",
  products: "products",
  hero_slides: "hero_slides",
  distributors: "distributors",
  pages: "pages",
  site_settings: "site_settings",
  news_posts: "news_posts",
  career_roles: "career_roles",
  faqs: "faqs",
  order_requests: "order_requests",
  contact_messages: "contact_messages",
  newsletter_subscribers: "newsletter_subscribers",
  audit_logs: "audit_logs",
  analytics_page_daily: "analytics_page_daily",
  analytics_product_daily: "analytics_product_daily",
} as const;

export type TableName = keyof typeof TABLES;

export function table(name: TableName): string {
  return TABLES[name];
}

function bind(conn: Pool | PoolConnection): Db {
  return {
    async query(sql, params = []) {
      const [rows] = await conn.query<SqlRow[]>(sql, params);
      return rows;
    },
    async exec(sql, params = []) {
      await conn.query(sql, params);
    },
  };
}

export const database = bind(pool);

export async function withTx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(bind(conn));
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function withAudit<T>(
  actor: { id: string; name: string; email: string },
  summary: string,
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  const text = summary.trim();
  if (!text) throw new HttpError(500, "INTERNAL", "Audit summary is empty");
  return withTx(async (db) => {
    const result = await fn(db);
    await db.exec(
      `INSERT INTO audit_logs (id, actor_user_id, actor_name, actor_email, summary) VALUES (?, ?, ?, ?, ?)`,
      [uuid(), actor.id, actor.name, actor.email, text.slice(0, 1024)],
    );
    return result;
  });
}

export async function requireRow(db: Db, name: TableName, id: string, label: string): Promise<SqlRow> {
  const rows = await db.query(`SELECT * FROM \`${table(name)}\` WHERE id = ? LIMIT 1`, [id]);
  const row = rows[0];
  if (!row) throw new HttpError(404, "NOT_FOUND", `${label} was not found`);
  return row;
}

export async function updateById(db: Db, name: TableName, id: string, fields: Record<string, unknown>) {
  const keys = Object.keys(fields).filter((key) => fields[key] !== undefined);
  if (keys.length === 0) throw new HttpError(400, "EMPTY_PATCH", "No fields to update");
  const assignments = keys.map((key) => `\`${key}\` = ?`).join(", ");
  await db.exec(`UPDATE \`${table(name)}\` SET ${assignments} WHERE id = ?`, [...keys.map((key) => fields[key]), id]);
}
