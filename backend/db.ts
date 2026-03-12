import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'coldbrew.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    low_threshold INTEGER NOT NULL DEFAULT 30,
    critical_threshold INTEGER NOT NULL DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER NOT NULL REFERENCES blocks(id),
    type TEXT NOT NULL CHECK(type IN ('incoming', 'outgoing')),
    quantity INTEGER NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed data if table is empty
const count = db.prepare('SELECT COUNT(*) as cnt FROM blocks').get() as { cnt: number };
if (count.cnt === 0) {
  const insert = db.prepare('INSERT INTO blocks (name, color, quantity) VALUES (?, ?, ?)');
  insert.run('Брусника и Малина', '#c0392b', 200);
  insert.run('Смородина и Слива', '#8e44ad', 200);
  insert.run('Гранат', '#e74c3c', 200);
}

export default db;
