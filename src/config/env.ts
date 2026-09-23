import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const boolFromString = z
  .string()
  .optional()
  .transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.string().url(),
  CORS_ORIGINS: z.string().min(1),
  DATABASE_URL: z.string().regex(/^mysql:\/\//, "DATABASE_URL must start with mysql://"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().regex(/^\d+[smhd]$/).default("15m"),
  JWT_REFRESH_TTL: z.string().regex(/^\d+[smhd]$/).default("7d"),
  COOKIE_SECURE: boolFromString,
  COOKIE_SAMESITE: z.enum(["lax", "none", "strict"]).optional(),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().min(3),
  OPS_EMAIL: z.string().email(),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  SEED_SUPER_ADMIN_EMAIL: z.string().email(),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(8),
  SEED_SUPER_ADMIN_NAME: z.string().min(1).default("Osworth Super Admin"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment. Copy .env.example to .env and fill every required value.");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;

const cookieSecure = data.COOKIE_SECURE ?? data.NODE_ENV === "production";
const cookieSameSite = data.COOKIE_SAMESITE ?? (cookieSecure ? "none" : "lax");

export const env = {
  ...data,
  corsOrigins: data.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
  cookieSecure,
  cookieSameSite,
};

export type Env = typeof env;
