import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('vocab.db');

let initialized = false;

export function initDatabase() {
  if (initialized) return;

  db.execSync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_preset INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      deck_id TEXT NOT NULL,
      word TEXT NOT NULL,
      phonetic TEXT DEFAULT '',
      definition TEXT NOT NULL,
      example TEXT DEFAULT '',
      is_starred INTEGER NOT NULL DEFAULT 0,
      mastery_level INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      card_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS cards_deck_id_idx ON cards(deck_id);
    CREATE INDEX IF NOT EXISTS study_attempts_created_at_idx ON study_attempts(created_at);
    CREATE INDEX IF NOT EXISTS study_attempts_card_id_idx ON study_attempts(card_id);
  `);

  // The original app database may predate the mastery column.
  const cardColumns = db.getAllSync<{ name: string }>('PRAGMA table_info(cards)');
  if (!cardColumns.some((column) => column.name === 'mastery_level')) {
    db.execSync('ALTER TABLE cards ADD COLUMN mastery_level INTEGER NOT NULL DEFAULT 0');
  }
  if (!cardColumns.some((column) => column.name === 'is_starred')) {
    db.execSync('ALTER TABLE cards ADD COLUMN is_starred INTEGER NOT NULL DEFAULT 0');
  }
  initialized = true;
}
