import mysql from "mysql2/promise";
import type { SslOptions } from "mysql2";
import { env } from "../config/env.js";

type PoolConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: SslOptions;
};

function wantsSsl(url: URL): boolean {
  const mode = (url.searchParams.get("ssl-mode") ?? url.searchParams.get("sslMode") ?? "").toUpperCase();
  const ssl = (url.searchParams.get("ssl") ?? "").toLowerCase();
  if (ssl === "true" || ssl === "1" || ssl === "require") return true;
  return mode === "REQUIRED" || mode === "VERIFY_CA" || mode === "VERIFY_IDENTITY" || mode === "REQUIRED_VERIFY_CA";
}

/** Parse mysql:// URLs including Aiven-style ?ssl-mode=REQUIRED query params. */
export function connectionFromUrl(databaseUrl: string): PoolConfig {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, "").split("?")[0] ?? "";
  if (!database) {
    throw new Error("DATABASE_URL is missing a database name");
  }

  const config: PoolConfig = {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };

  if (wantsSsl(url)) {
    // Managed MySQL (Aiven, Azure, etc.) requires TLS. CA pinning can be added later if needed.
    config.ssl = { rejectUnauthorized: true };
  }

  return config;
}

const base = connectionFromUrl(env.DATABASE_URL);

export const pool = mysql.createPool({
  ...base,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "Z",
  dateStrings: true,
  charset: "utf8mb4",
  multipleStatements: false,
  enableKeepAlive: true,
});
