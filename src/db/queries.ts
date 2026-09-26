// src/db/queries.ts
import { db } from './schema';

export interface Deck {
  id: string;
  title: string;
  description: string;
  is_preset: number;
  created_at: number;
  card_count?: number; // 該單字本包含的單字數
}

export interface Card {
  id: string;
  deck_id: string;
  word: string;
  phonetic: string;
  definition: string;
  example: string;
  is_starred: number;
  mastery_level: number;
}

// 1. 取得所有單字本 (含單字數量)
export const getDecks = (): Deck[] => {
  return db.getAllSync<Deck>(`
    SELECT d.*, COUNT(c.id) as card_count 
    FROM decks d 
    LEFT JOIN cards c ON d.id = c.deck_id 
    GROUP BY d.id 
    ORDER BY d.created_at DESC
  `);
};

// 2. 新增單字本
export const addDeck = (title: string, description: string = '') => {
  const id = Date.now().toString();
  const createdAt = Date.now();
  db.runSync(
    'INSERT INTO decks (id, title, description, created_at) VALUES (?, ?, ?, ?)',
    [id, title, description, createdAt]
  );
  return id;
};

// 3. 取得特定單字本內的所有單字
export const getCardsByDeckId = (deckId: string): Card[] => {
  return db.getAllSync<Card>('SELECT * FROM cards WHERE deck_id = ? ORDER BY id DESC', [deckId]);
};

// 4. 新增單字
export const addCard = (
  deckId: string,
  word: string,
  definition: string,
  phonetic: string = '',
  example: string = ''
) => {
  const id = Date.now().toString();
  db.runSync(
    'INSERT INTO cards (id, deck_id, word, phonetic, definition, example) VALUES (?, ?, ?, ?, ?, ?)',
    [id, deckId, word, phonetic, definition, example]
  );
};

export const recordStudyAttempt = (cardId: string, mode: string, isCorrect: boolean) => {
  db.runSync(
    'INSERT INTO study_attempts (id, card_id, mode, is_correct, created_at) VALUES (?, ?, ?, ?, ?)',
    [`${Date.now()}-${Math.random().toString(36).slice(2)}`, cardId, mode, isCorrect ? 1 : 0, Date.now()]
  );
};
