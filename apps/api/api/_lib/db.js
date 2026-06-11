import pg from 'pg';
const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

// Production: use Supabase REST API (IPv4 HTTPS, works from Vercel)
// Local dev: use pg directly (DATABASE_URL set to localhost)
export async function query(sql, params = []) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (supabaseUrl && supabaseKey) {
    const args = (params || []).map(p => {
      if (p === null || p === undefined) return null;
      if (p instanceof Date) return p.toISOString();
      return String(p);
    });

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_query`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'node/20',
      },
      body: JSON.stringify({ query_text: sql, params: args }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DB error: ${err}`);
    }

    const rows = await res.json();
    return { rows: Array.isArray(rows) ? rows : rows ? [rows] : [] };
  }

  // Local dev fallback
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}
