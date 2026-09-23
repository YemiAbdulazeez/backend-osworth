import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../lib/httpError.js";

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "VALIDATION_ERROR", "Invalid request body", parsed.error.flatten()));
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function parseQuery<T>(schema: ZodType<T>, query: Request["query"]): T {
  const flat: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  const parsed = schema.safeParse(flat);
  if (!parsed.success) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid query string", parsed.error.flatten());
  }
  return parsed.data;
}
