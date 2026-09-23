import mysql from "mysql2/promise";
import { env } from "../config/env.js";

function connectionFromUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, "");
  if (!database) {
    throw new Error("DATABASE_URL is missing a database name");
  }
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
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
