import Database from 'better-sqlite3'
import path from 'path'
import { AGENCY_CONFIGS } from './agency-config'

const DB_PATH = path.join(process.cwd(), 'data', 'magnet.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    // dataディレクトリ作成
    const fs = require('fs')
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initDb(_db)
  }
  return _db
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT CHECK (status IN ('継続', '新規')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
      rank_date TEXT NOT NULL,
      rank_value REAL,
      fetched_at TEXT DEFAULT (datetime('now')),
      UNIQUE(store_id, rank_date)
    );

    CREATE TABLE IF NOT EXISTS fetch_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fetched_at TEXT DEFAULT (datetime('now')),
      status TEXT,
      stores_updated INTEGER DEFAULT 0,
      error_message TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_rankings_store_date ON rankings(store_id, rank_date DESC);
    CREATE INDEX IF NOT EXISTS idx_stores_agency ON stores(agency_id);
  `)

  // 初期データが無い場合のみ投入
  const count = db.prepare('SELECT COUNT(*) as cnt FROM agencies').get() as { cnt: number }
  if (count.cnt === 0) {
    seedData(db)
  }
}

function seedData(db: Database.Database) {
  const insertAgency = db.prepare('INSERT OR IGNORE INTO agencies (name) VALUES (?)')
  const insertStore = db.prepare(
    'INSERT OR IGNORE INTO stores (agency_id, name, status) VALUES (?, ?, ?)'
  )
  const getAgencyId = db.prepare('SELECT id FROM agencies WHERE name = ?')

  const transaction = db.transaction(() => {
    for (const config of AGENCY_CONFIGS) {
      insertAgency.run(config.name)
      const row = getAgencyId.get(config.name) as { id: number }
      for (const storeName of config.stores) {
        insertStore.run(row.id, storeName, '継続')
      }
    }
  })

  transaction()
}

// 型定義
export interface AgencyRow {
  id: number
  name: string
  created_at: string
}

export interface StoreRow {
  id: number
  agency_id: number
  name: string
  status: string
  created_at: string
  updated_at: string
}

export interface RankingRow {
  id: number
  store_id: number
  rank_date: string
  rank_value: number | null
  fetched_at: string
}

export interface FetchLogRow {
  id: number
  fetched_at: string
  status: string
  stores_updated: number
  error_message: string | null
}
