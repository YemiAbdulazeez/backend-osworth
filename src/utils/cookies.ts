import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";
import { ttlToMs } from "./tokens.js";

export const REFRESH_COOKIE = "osworth_refresh";
export const REMEMBER_COOKIE = "osworth_remember";

/** Persistent refresh when "Remember me" is checked (30 days). */
const REMEMBER_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function refreshCookieOptions(rememberMe = false): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/api/v1/auth",
  };
  if (rememberMe) {
    options.maxAge = Math.max(ttlToMs(env.JWT_REFRESH_TTL), REMEMBER_MAX_AGE_MS);
  }
  // Without rememberMe, omit maxAge so the cookie is session-scoped (cleared when the browser closes).
  return options;
}

export function setRefreshCookie(res: Response, token: string, rememberMe = false) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions(rememberMe));
  res.cookie(REMEMBER_COOKIE, rememberMe ? "1" : "0", {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/api/v1/auth",
    ...(rememberMe ? { maxAge: REMEMBER_MAX_AGE_MS } : {}),
  });
}

export function clearRefreshCookie(res: Response) {
  const base = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/api/v1/auth",
  } as const;
  res.clearCookie(REFRESH_COOKIE, base);
  res.clearCookie(REMEMBER_COOKIE, base);
}
