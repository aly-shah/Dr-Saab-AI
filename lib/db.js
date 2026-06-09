// Shared Postgres pool for the website (admin dashboard reads the same DB
// the bot writes to). Singleton across hot reloads.
import pg from "pg";

const g = globalThis;

export const pool =
  g.__drsaabPool ||
  (g.__drsaabPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
  }));

export async function q(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}
