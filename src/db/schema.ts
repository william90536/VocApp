// src/db/schema.ts
import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('vocab.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_preset INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      deck_id TEXT NOT NULL,
      word TEXT NOT NULL,
      phonetic TEXT,
      definition TEXT NOT NULL,
      example TEXT,
      is_starred INTEGER DEFAULT 0,
      mastery_level INTEGER DEFAULT 0,
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
  `);
};
