import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { database } from "../db/sql.js";
import { HttpError } from "../lib/httpError.js";
import type { StaffRole } from "../types/staff.js";

type AccessPayload = {
  sub: string;
  role: StaffRole;
  email: string;
  sid: string;
};

export function signAccess(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"] });
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match?.[1]) throw new HttpError(401, "UNAUTHENTICATED", "Sign in required");

    let decoded: jwt.JwtPayload;
    try {
      const verified = jwt.verify(match[1], env.JWT_ACCESS_SECRET);
      if (typeof verified === "string") throw new Error("bad token");
      decoded = verified;
    } catch {
      throw new HttpError(401, "UNAUTHENTICATED", "Access token is invalid or expired");
    }

    if (!decoded.sub || !decoded.sid || typeof decoded.email !== "string" || typeof decoded.role !== "string") {
      throw new HttpError(401, "UNAUTHENTICATED", "Access token is invalid or expired");
    }

    const users = await database.query(
      `SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1`,
      [decoded.sub],
    );
    const user = users[0];
    if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Account no longer exists");
    if (String(user.status ?? "active") === "suspended") {
      throw new HttpError(403, "ACCOUNT_SUSPENDED", "This account has been suspended. Contact a super admin.");
    }

    const sessions = await database.query(
      `SELECT id, user_id FROM sessions WHERE id = ? AND revoked_at IS NULL LIMIT 1`,
      [String(decoded.sid)],
    );
    const session = sessions[0];
    if (!session || session.user_id !== user.id) {
      throw new HttpError(401, "UNAUTHENTICATED", "Session is no longer active");
    }

    await database.exec(
      `UPDATE sessions
       SET last_active_at = CURRENT_TIMESTAMP(3)
       WHERE id = ? AND revoked_at IS NULL
         AND last_active_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 MINUTE)`,
      [session.id],
    );

    req.staff = {
      id: String(user.id),
      name: String(user.name),
      email: String(user.email),
      role: String(user.role) as StaffRole,
      sessionId: String(session.id),
    };
    next();
  } catch (error) {
    next(error);
  }
}

export async function tryAttachStaff(req: Request): Promise<boolean> {
  if (!req.header("authorization")) return false;
  try {
    await new Promise<void>((resolve, reject) => {
      void requireAuth(req, {} as Response, (error?: unknown) => (error ? reject(error) : resolve()));
    });
    return Boolean(req.staff);
  } catch {
    req.staff = undefined;
    return false;
  }
}

export const requireStaff = requireAuth;

export function requireRole(...roles: StaffRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.staff) {
      next(new HttpError(401, "UNAUTHENTICATED", "Sign in required"));
      return;
    }
    if (!roles.includes(req.staff.role)) {
      next(new HttpError(403, "FORBIDDEN", "You do not have permission to do that"));
      return;
    }
    next();
  };
}

export const requireContentWriter = requireRole("super_admin", "admin", "editor");
export const requireEngagementDelete = requireRole("super_admin", "admin", "editor");
