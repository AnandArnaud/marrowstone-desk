// The one database access path. Plain SQL with positional `?` parameters, run against a local
// SQLite file in development and MySQL 8 in production (docs/adr/0001-database.md). The SQL
// stays inside the subset both engines share.

export type Row = Record<string, unknown>;

type Driver = {
  query: (sql: string, params: unknown[]) => Promise<Row[]>;
  execute: (sql: string, params: unknown[]) => Promise<{ rowsAffected: number }>;
};

const DB_CLIENT = process.env.DB_CLIENT ?? "sqlite";
const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/marrowstone.db";

let driverPromise: Promise<Driver> | null = null;

async function sqliteDriver(): Promise<Driver> {
  const { createClient } = await import("@libsql/client");
  const client = createClient({ url: DATABASE_URL });
  await client.execute("PRAGMA foreign_keys = ON");
  return {
    async query(sql, params) {
      const result = await client.execute({ sql, args: params as never[] });
      return result.rows.map((row) => ({ ...row }) as Row);
    },
    async execute(sql, params) {
      const result = await client.execute({ sql, args: params as never[] });
      return { rowsAffected: result.rowsAffected };
    },
  };
}

async function mysqlDriver(): Promise<Driver> {
  const mysql = await import("mysql2/promise");
  const pool = mysql.createPool({
    uri: DATABASE_URL,
    connectionLimit: Number(process.env.DB_POOL_MAX ?? 10),
    dateStrings: true,
  });
  return {
    async query(sql, params) {
      const [rows] = await pool.query(sql, params as never[]);
      return rows as Row[];
    },
    async execute(sql, params) {
      const [result] = await pool.execute(sql, params as never[]);
      return { rowsAffected: (result as { affectedRows?: number }).affectedRows ?? 0 };
    },
  };
}

function driver(): Promise<Driver> {
  if (!driverPromise) {
    driverPromise = DB_CLIENT === "mysql" ? mysqlDriver() : sqliteDriver();
  }
  return driverPromise;
}

export async function query<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await (await driver()).query(sql, params)) as T[];
}

export async function queryOne<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<{ rowsAffected: number }> {
  return (await driver()).execute(sql, params);
}

/** Timestamps are stored as ISO-8601 text in SQLite and DATETIME in MySQL; this is the writer. */
export function now(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
