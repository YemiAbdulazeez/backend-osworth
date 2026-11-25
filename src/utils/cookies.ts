import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";
import { ttlToMs } from "./tokens.js";

export const REFRESH_COOKIE = "osworth_refresh";
export const REMEMBER_COOKIE = "osworth_remember";

/** Persistent refresh when "Remember me" is checked (30 days). */
const REMEMBER_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function refreshCookieOptions(rememberMe = false): CookieOptions {
  const refreshMs = ttlToMs(env.JWT_REFRESH_TTL);
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/api/v1/auth",
    // Always persist the refresh cookie so admin sessions survive browser restarts
    // and short access-token expiry. "Remember me" keeps it for at least 30 days.
    maxAge: rememberMe ? Math.max(refreshMs, REMEMBER_MAX_AGE_MS) : refreshMs,
  };
}

export function setRefreshCookie(res: Response, token: string, rememberMe = false) {
  const options = refreshCookieOptions(rememberMe);
  res.cookie(REFRESH_COOKIE, token, options);
  res.cookie(REMEMBER_COOKIE, rememberMe ? "1" : "0", {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/api/v1/auth",
    maxAge: options.maxAge,
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
