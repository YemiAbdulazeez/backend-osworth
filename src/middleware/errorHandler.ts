import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { HttpError } from "../lib/httpError.js";
import { env } from "../config/env.js";

function mysqlCode(error: unknown): string | undefined {
  if (typeof error === "object" && error && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return undefined;
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details ?? undefined },
    });
    return;
  }

  if (error instanceof MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Image must be under 4MB" : "Could not read that upload";
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message } });
    return;
  }

  if (error instanceof Error && error.message === "Please choose an image file") {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.message } });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body must be JSON" } });
    return;
  }

  const code = mysqlCode(error);
  if (code === "ER_DUP_ENTRY") {
    res.status(409).json({ error: { code: "CONFLICT", message: "That value is already in use" } });
    return;
  }

  console.error(error);
  const body: { error: { code: string; message: string; details?: string } } = {
    error: { code: "INTERNAL", message: "Something went wrong" },
  };
  if (env.NODE_ENV === "development" && error instanceof Error) {
    body.error.details = error.message;
  }
  res.status(500).json(body);
}
