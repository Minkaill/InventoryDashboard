import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:data/coldbrew.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDb() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      low_threshold INTEGER NOT NULL DEFAULT 30,
      critical_threshold INTEGER NOT NULL DEFAULT 10
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_id INTEGER NOT NULL REFERENCES blocks(id),
      type TEXT NOT NULL CHECK(type IN ('incoming', 'outgoing')),
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { rows } = await client.execute('SELECT COUNT(*) as cnt FROM blocks');
  if ((rows[0].cnt as number) === 0) {
    await client.batch([
      { sql: 'INSERT INTO blocks (name, color, quantity) VALUES (?, ?, ?)', args: ['Брусника и Малина', '#c0392b', 200] },
      { sql: 'INSERT INTO blocks (name, color, quantity) VALUES (?, ?, ?)', args: ['Смородина и Слива', '#8e44ad', 200] },
      { sql: 'INSERT INTO blocks (name, color, quantity) VALUES (?, ?, ?)', args: ['Гранат', '#e74c3c', 200] },
    ], 'write');
  }
}

export default client;
