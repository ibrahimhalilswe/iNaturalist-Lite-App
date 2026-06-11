import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const isLocal = (process.env.DATABASE_URL || '').includes('localhost') ||
                    (process.env.DATABASE_URL || '').includes('127.0.0.1');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

export async function query(sql, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}
