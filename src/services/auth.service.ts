import { env } from "../config/env.js";
import { toIso } from "../db/map.js";
import { database, requireRow, updateById, withAudit, type SqlRow } from "../db/sql.js";
import { HttpError } from "../lib/httpError.js";
import { signAccess } from "../middleware/auth.js";
import type { PublicUser, StaffActor, StaffRole } from "../types/staff.js";
import { uuid } from "../utils/ids.js";
import { hashPassword, tempPassword, verifyPassword } from "../utils/passwords.js";
import { hashToken, newRefreshToken } from "../utils/tokens.js";
import type { UserStatus } from "../types/staff.js";

let dummyHash: string | null = null;

function mapUser(row: SqlRow): PublicUser {
  const status = String(row.status ?? "active") === "suspended" ? "suspended" : "active";
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    phone: row.phone == null ? "" : String(row.phone),
    address: row.address == null ? "" : String(row.address),
    avatarUrl: row.avatar_url == null ? "" : String(row.avatar_url),
    role: String(row.role) as StaffRole,
    status: status as UserStatus,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function userByEmail(email: string): Promise<SqlRow | undefined> {
  const rows = await database.query(`SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`, [email.trim()]);
  return rows[0];
}

export async function login(input: { email: string; password: string; userAgent: string; ip: string }) {
  const user = await userByEmail(input.email);
  if (!user) {
    dummyHash ??= await hashPassword("osworth-timing-pad");
    await verifyPassword(input.password, dummyHash);
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  const matches = await verifyPassword(input.password, String(user.password_hash));
  if (!matches) throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  if (String(user.status ?? "active") === "suspended") {
    throw new HttpError(403, "ACCOUNT_SUSPENDED", "This account has been suspended. Contact a super admin.");
  }

  const sessionId = uuid();
  const refreshToken = newRefreshToken();
  const actor = { id: String(user.id), name: String(user.name), email: String(user.email) };
  await withAudit(actor, "Signed in to the dashboard", async (tx) => {
    await tx.exec(
      `INSERT INTO sessions (id, user_id, refresh_token_hash, user_agent, ip) VALUES (?, ?, ?, ?, ?)`,
      [sessionId, user.id, hashToken(refreshToken), input.userAgent || null, input.ip || null],
    );
  });

  return {
    accessToken: signAccess({
      sub: actor.id,
      role: String(user.role) as StaffRole,
      email: actor.email,
      sid: sessionId,
    }),
    expiresIn: env.JWT_ACCESS_TTL,
    refreshToken,
    user: mapUser(user),
  };
}

export async function refresh(refreshToken: string) {
  const rows = await database.query(
    `SELECT s.id, s.user_id, u.email, u.role, u.status
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.refresh_token_hash = ? AND s.revoked_at IS NULL
     LIMIT 1`,
    [hashToken(refreshToken)],
  );
  const session = rows[0];
  if (!session) throw new HttpError(401, "UNAUTHENTICATED", "Refresh token is invalid or expired");
  if (String(session.status ?? "active") === "suspended") {
    throw new HttpError(403, "ACCOUNT_SUSPENDED", "This account has been suspended. Contact a super admin.");
  }
  const nextToken = newRefreshToken();
  await database.exec(
    `UPDATE sessions SET refresh_token_hash = ?, last_active_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND revoked_at IS NULL`,
    [hashToken(nextToken), session.id],
  );
  return {
    accessToken: signAccess({
      sub: String(session.user_id),
      role: String(session.role) as StaffRole,
      email: String(session.email),
      sid: String(session.id),
    }),
    expiresIn: env.JWT_ACCESS_TTL,
    refreshToken: nextToken,
  };
}

export async function logout(input: { actor?: StaffActor; refreshToken?: string }) {
  let actor = input.actor;
  let sessionId = actor?.sessionId;
  if (!sessionId && input.refreshToken) {
    const rows = await database.query(
      `SELECT s.id, s.user_id, u.name, u.email
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.refresh_token_hash = ? AND s.revoked_at IS NULL LIMIT 1`,
      [hashToken(input.refreshToken)],
    );
    const session = rows[0];
    if (session) {
      sessionId = String(session.id);
      actor = {
        id: String(session.user_id),
        name: String(session.name),
        email: String(session.email),
        role: "staff",
        sessionId,
      };
    }
  }
  if (!actor || !sessionId) throw new HttpError(401, "UNAUTHENTICATED", "Sign in required");
  await withAudit(
    { id: actor.id, name: actor.name, email: actor.email },
    "Signed out of the dashboard",
    async (tx) => {
      await tx.exec(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND revoked_at IS NULL`, [sessionId]);
    },
  );
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const row = await requireRow(database, "users", userId, "Profile");
  return mapUser(row);
}

export async function updateProfile(
  actor: StaffActor,
  patch: { name?: string; phone?: string; address?: string; avatarUrl?: string; avatar_url?: string; email?: string },
) {
  const email = patch.email?.trim().toLowerCase();
  if (email && email !== actor.email.toLowerCase()) {
    const taken = await database.query(`SELECT id FROM users WHERE LOWER(email) = ? AND id <> ? LIMIT 1`, [email, actor.id]);
    if (taken[0]) throw new HttpError(409, "CONFLICT", "That email is already in use");
  }
  const avatar = patch.avatarUrl ?? patch.avatar_url;
  await withAudit(actor, "Updated their profile details", async (tx) => {
    await updateById(tx, "users", actor.id, {
      name: patch.name?.trim(),
      phone: patch.phone?.trim(),
      address: patch.address?.trim(),
      avatar_url: avatar?.trim(),
      email,
    });
  });
  return getProfile(actor.id);
}

export async function changePassword(actor: StaffActor, currentPassword: string, newPassword: string) {
  const row = await requireRow(database, "users", actor.id, "Profile");
  const matches = await verifyPassword(currentPassword, String(row.password_hash));
  if (!matches) throw new HttpError(400, "VALIDATION_ERROR", "Current password is incorrect");
  const passwordHash = await hashPassword(newPassword);
  await withAudit(actor, "Changed their account password", async (tx) => {
    await updateById(tx, "users", actor.id, { password_hash: passwordHash });
    await tx.exec(
      `UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND id <> ? AND revoked_at IS NULL`,
      [actor.id, actor.sessionId],
    );
  });
}

export async function listSessions(actor: StaffActor) {
  const rows = await database.query(
    `SELECT s.id, s.user_id, s.user_agent, s.created_at, s.last_active_at, u.email
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.user_id = ? AND s.revoked_at IS NULL
     ORDER BY s.last_active_at DESC`,
    [actor.id],
  );
  return rows.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    email: String(row.email),
    createdAt: toIso(row.created_at),
    lastActiveAt: toIso(row.last_active_at),
    userAgent: row.user_agent == null || row.user_agent === "" ? "Unknown device" : String(row.user_agent),
    current: String(row.id) === actor.sessionId,
  }));
}

export async function revokeSession(actor: StaffActor, sessionId: string) {
  const rows = await database.query(
    `SELECT id, user_id FROM sessions WHERE id = ? AND revoked_at IS NULL LIMIT 1`,
    [sessionId],
  );
  const session = rows[0];
  if (!session || session.user_id !== actor.id) throw new HttpError(404, "NOT_FOUND", "Session was not found");
  const current = String(session.id) === actor.sessionId;
  await withAudit(
    actor,
    current ? "Ended their current session" : "Revoked a signed-in session on another device",
    async (tx) => {
      await tx.exec(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP(3) WHERE id = ?`, [sessionId]);
    },
  );
  return { current };
}

export async function listUsers() {
  const rows = await database.query(`SELECT * FROM users ORDER BY created_at DESC`);
  return rows.map(mapUser);
}

export async function createAdmin(
  actor: StaffActor,
  input: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    role?: "admin" | "super_admin";
    password?: string;
  },
) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const role = input.role === "super_admin" ? "super_admin" : "admin";
  const existing = await database.query(`SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1`, [email]);
  if (existing[0]) throw new HttpError(409, "CONFLICT", "An account with that email already exists");
  const password = input.password?.trim() && input.password.trim().length >= 8 ? input.password.trim() : tempPassword();
  const passwordHash = await hashPassword(password);
  const id = uuid();
  const user = await withAudit(
    actor,
    `Created a new ${role.replace("_", " ")} account for ${name} (${email})`,
    async (tx) => {
      await tx.exec(
        `INSERT INTO users (id, name, email, password_hash, phone, address, avatar_url, role, status)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 'active')`,
        [id, name, email, passwordHash, (input.phone ?? "").trim(), (input.address ?? "").trim(), role],
      );
      return mapUser(await requireRow(tx, "users", id, "User"));
    },
  );
  return { user, temporaryPassword: password };
}

export async function resetAdminPassword(
  actor: StaffActor,
  id: string,
  input?: { password?: string },
) {
  if (id === actor.id) {
    throw new HttpError(400, "VALIDATION_ERROR", "Use My profile to change your own password");
  }
  const target = await requireRow(database, "users", id, "User");
  const password = input?.password?.trim() && input.password.trim().length >= 8 ? input.password.trim() : tempPassword();
  const passwordHash = await hashPassword(password);
  await withAudit(
    actor,
    `Reset password for ${String(target.name)} (${String(target.email)})`,
    async (tx) => {
      await updateById(tx, "users", id, { password_hash: passwordHash });
      await tx.exec(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND revoked_at IS NULL`, [id]);
    },
  );
  return { user: mapUser(await requireRow(database, "users", id, "User")), temporaryPassword: password };
}

export async function setAdminStatus(actor: StaffActor, id: string, status: UserStatus) {
  if (id === actor.id) throw new HttpError(403, "FORBIDDEN", "You cannot suspend your own account");
  const target = await requireRow(database, "users", id, "User");
  if (String(target.role) === "super_admin" && status === "suspended") {
    throw new HttpError(403, "FORBIDDEN", "Super admin accounts cannot be suspended");
  }
  await withAudit(
    actor,
    `${status === "suspended" ? "Suspended" : "Reactivated"} account for ${String(target.name)} (${String(target.email)})`,
    async (tx) => {
      await updateById(tx, "users", id, { status });
      if (status === "suspended") {
        await tx.exec(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND revoked_at IS NULL`, [id]);
      }
    },
  );
  return mapUser(await requireRow(database, "users", id, "User"));
}

export async function removeAdmin(actor: StaffActor, id: string) {
  if (id === actor.id) throw new HttpError(403, "FORBIDDEN", "You cannot remove your own account");
  const target = await requireRow(database, "users", id, "User");
  if (String(target.role) === "super_admin") {
    throw new HttpError(403, "FORBIDDEN", "Super admin accounts cannot be removed");
  }
  await withAudit(actor, `Removed admin account for ${String(target.name)} (${String(target.email)})`, async (tx) => {
    await tx.exec(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND revoked_at IS NULL`, [id]);
    await tx.exec(`DELETE FROM users WHERE id = ? AND role <> 'super_admin'`, [id]);
  });
}
