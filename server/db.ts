import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const connectionString = process.env.DATABASE_URL;
const url = new URL(connectionString);
const sslMode = url.searchParams.get("sslmode");
const useSsl = process.env.DB_SSL === "true" || (
  process.env.DB_SSL !== "false" && sslMode === "require"
);

export const pool = new Pool({
  // Let node-postgres parse the complete connection string. This preserves
  // Supabase pooler usernames such as "postgres.<projectref>".
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle({ client: pool, schema });
