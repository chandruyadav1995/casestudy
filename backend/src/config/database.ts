import Database, { Database as DB } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/pricing.db';
const dbDir = path.dirname(DB_PATH);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db: DB = new Database(DB_PATH);

// Performance tuning for concurrent reads
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000'); // 64MB cache
db.pragma('foreign_keys = ON');

function initializeSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS upload_batches (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      filename    TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      record_count INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      status      TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','completed','failed')),
      errors      TEXT
    );

    CREATE TABLE IF NOT EXISTS pricing_records (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id      TEXT NOT NULL,
      sku           TEXT NOT NULL,
      product_name  TEXT NOT NULL,
      price         REAL NOT NULL CHECK (price >= 0),
      date          TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      upload_batch_id INTEGER REFERENCES upload_batches(id) ON DELETE SET NULL,
      UNIQUE (store_id, sku, date)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id    INTEGER NOT NULL REFERENCES pricing_records(id) ON DELETE CASCADE,
      field_changed TEXT NOT NULL,
      old_value    TEXT,
      new_value    TEXT,
      changed_at   TEXT NOT NULL DEFAULT (datetime('now')),
      changed_by   TEXT NOT NULL DEFAULT 'system'
    );

    CREATE INDEX IF NOT EXISTS idx_pricing_store_id   ON pricing_records(store_id);
    CREATE INDEX IF NOT EXISTS idx_pricing_sku        ON pricing_records(sku);
    CREATE INDEX IF NOT EXISTS idx_pricing_date       ON pricing_records(date);
    CREATE INDEX IF NOT EXISTS idx_pricing_price      ON pricing_records(price);
    CREATE INDEX IF NOT EXISTS idx_pricing_product    ON pricing_records(product_name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_audit_record_id   ON audit_logs(record_id);
  `);
}

initializeSchema();

export default db;
