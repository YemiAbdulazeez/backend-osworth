import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

function limiter(limit: number) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === "production" ? limit : Math.max(limit, 300),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many requests. Try again later." } },
  });
}

export const authWriteLimit = limiter(10);
export const publicWriteLimit = limiter(30);
