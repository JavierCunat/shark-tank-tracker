// One shared connection pool for the whole server. Next.js hot-reloads modules in dev,
// so we stash the pool on globalThis to avoid opening a new pool on every reload.
import pg from "pg";

// Return DATE columns as plain "YYYY-MM-DD" strings instead of JS Date objects (which
// would be shifted by the server timezone and break our date formatting).
pg.types.setTypeParser(1082, (v) => v);

const globalForPg = globalThis as unknown as { pgPool?: pg.Pool };

export const pool =
  globalForPg.pgPool ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

export async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query<T>(text, params);
  return res.rows;
}
