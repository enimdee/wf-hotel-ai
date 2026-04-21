import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/lib/env";
import * as schema from "./schema";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (pool) return pool;
  const url = env().DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Phase 1 runs without the database — only Phase 2+ needs this.",
    );
  }
  pool = mysql.createPool({
    uri: url,
    connectionLimit: 10,
    waitForConnections: true,
    namedPlaceholders: true,
    timezone: "+07:00",
  });
  return pool;
}

export function getDb() {
  return drizzle(getPool(), { schema, mode: "default" });
}
