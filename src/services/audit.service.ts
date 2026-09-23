import type { StaffActor } from "../types/staff.js";
import { toIso } from "../db/map.js";
import { database, type SqlRow } from "../db/sql.js";
import { HttpError } from "../lib/httpError.js";

export type AuditItem = {
  id: string;
  summary: string;
  actorName: string;
  actorEmail: string;
  createdAt: string;
};

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt, id }), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { createdAt?: string; id?: string };
    if (!parsed.createdAt || !parsed.id) return null;
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

export async function listAudit(query: { user?: string; from?: string; to?: string; limit?: number; cursor?: string }) {
  const limit = query.limit ?? 200;
  const where = ["1=1"];
  const params: unknown[] = [];
  if (query.user) {
    where.push("LOWER(actor_email) = LOWER(?)");
    params.push(query.user);
  }
  if (query.from) {
    where.push("created_at >= ?");
    params.push(`${query.from} 00:00:00.000`);
  }
  if (query.to) {
    where.push("created_at < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(`${query.to} 00:00:00.000`);
  }
  if (query.cursor) {
    const decoded = decodeCursor(query.cursor);
    if (!decoded) throw new HttpError(400, "VALIDATION_ERROR", "Invalid cursor");
    where.push("(created_at < ? OR (created_at = ? AND id < ?))");
    params.push(decoded.createdAt, decoded.createdAt, decoded.id);
  }
  const rows = await database.query(
    `SELECT id, summary, actor_name, actor_email, created_at
     FROM audit_logs
     WHERE ${where.join(" AND ")}
     ORDER BY created_at DESC, id DESC
     LIMIT ${limit + 1}`,
    params,
  );
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    data: page.map(mapAudit),
    nextCursor: rows.length > limit && last ? encodeCursor(String(last.created_at), String(last.id)) : null,
  };
}

function mapAudit(row: SqlRow): AuditItem {
  return {
    id: String(row.id),
    summary: String(row.summary),
    actorName: String(row.actor_name),
    actorEmail: String(row.actor_email),
    createdAt: toIso(row.created_at),
  };
}

export function actorOf(staff: StaffActor) {
  return { id: staff.id, name: staff.name, email: staff.email };
}
