import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireStaff, tryAttachStaff } from "../middleware/auth.js";
import { authWriteLimit } from "../middleware/rateLimit.js";
import { validateBody } from "../middleware/validate.js";
import { getProfile, login, logout, refresh } from "../services/auth.service.js";
import { REFRESH_COOKIE, REMEMBER_COOKIE, clearRefreshCookie, setRefreshCookie } from "../utils/cookies.js";
import { loginSchema } from "../validations/schemas.js";

const router = Router();

function cookieToken(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function wantsRemember(value: unknown): boolean {
  return value === "1" || value === true;
}

router.post(
  "/login",
  authWriteLimit,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const rememberMe = Boolean(req.body.rememberMe);
    const result = await login({
      email: req.body.email,
      password: req.body.password,
      userAgent: (req.get("user-agent") ?? "").slice(0, 512),
      ip: (req.ip ?? "").slice(0, 64),
    });
    setRefreshCookie(res, result.refreshToken, rememberMe);
    res.json({ accessToken: result.accessToken, expiresIn: result.expiresIn, user: result.user });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = cookieToken(req.cookies?.[REFRESH_COOKIE]);
    if (!token) {
      res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Refresh token is missing" } });
      return;
    }
    const rememberMe = wantsRemember(req.cookies?.[REMEMBER_COOKIE]);
    const result = await refresh(token);
    setRefreshCookie(res, result.refreshToken, rememberMe);
    res.json({ accessToken: result.accessToken, expiresIn: result.expiresIn });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    await tryAttachStaff(req);
    await logout({ actor: req.staff, refreshToken: cookieToken(req.cookies?.[REFRESH_COOKIE]) });
    clearRefreshCookie(res);
    res.status(204).end();
  }),
);

router.get(
  "/me",
  requireStaff,
  asyncHandler(async (req, res) => {
    res.json(await getProfile(req.staff!.id));
  }),
);

export const authRouter = router;
