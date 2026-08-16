import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const url = new URL(process.env.DATABASE_URL);
const sslMode = url.searchParams.get("sslmode");
const useSsl = process.env.DB_SSL === "true" || (
  process.env.DB_SSL !== "false" && sslMode === "require"
);

export const pool = new Pool({ 
  host: url.hostname,
  port: Number(url.port) || 5432,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle({ client: pool, schema });
