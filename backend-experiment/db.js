/**
 * Neon PostgreSQL client — shared database connection pool.
 * Uses the connection string from .env (DATABASE_URL).
 */
import pkg from "pg";

const { Pool } = pkg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

db.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

export default db;
