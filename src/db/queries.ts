import { db, initDatabase } from './schema';

export interface Deck {
  id: string;
  title: string;
  description: string;
  is_preset: number;
  created_at: number;
  card_count: number;
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

export interface StudySummary {
  deckCount: number;
  cardCount: number;
  starredCount: number;
  masteredCount: number;
  todayAttempts: number;
  weekAttempts: number;
  accuracy: number;
  week: { date: string; label: string; attempts: number }[];
}

export interface RecentAttempt {
  id: string;
  word: string;
  mode: string;
  is_correct: number;
  created_at: number;
}

function ready() {
  initDatabase();
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDecks(): Deck[] {
  ready();
  return db.getAllSync<Deck>(`
    SELECT d.id, d.title, d.description, d.is_preset, d.created_at,
      COUNT(c.id) AS card_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `);
}

export function getDeckById(id: string): Deck | null {
  ready();
  return db.getFirstSync<Deck>(`
    SELECT d.id, d.title, d.description, d.is_preset, d.created_at,
      COUNT(c.id) AS card_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    WHERE d.id = ?
    GROUP BY d.id
  `, [id]);
}

export function addDeck(title: string, description = ''): string {
  ready();
  const id = newId();
  db.runSync(
    'INSERT INTO decks (id, title, description, created_at) VALUES (?, ?, ?, ?)',
    [id, title.trim(), description.trim(), Date.now()],
  );
  return id;
}

export function updateDeck(id: string, title: string, description: string) {
  ready();
  db.runSync('UPDATE decks SET title = ?, description = ? WHERE id = ?', [title.trim(), description.trim(), id]);
}

export function deleteDeck(id: string) {
  ready();
  db.runSync('DELETE FROM decks WHERE id = ?', [id]);
}

export function getCardsByDeckId(deckId: string): Card[] {
  ready();
  return db.getAllSync<Card>(
    'SELECT * FROM cards WHERE deck_id = ? ORDER BY rowid DESC',
    [deckId],
  );
}

export function addCard(
  deckId: string,
  word: string,
  definition: string,
  phonetic = '',
  example = '',
): string {
  ready();
  const id = newId();
  db.runSync(
    'INSERT INTO cards (id, deck_id, word, phonetic, definition, example) VALUES (?, ?, ?, ?, ?, ?)',
    [id, deckId, word.trim(), phonetic.trim(), definition.trim(), example.trim()],
  );
  return id;
}

export function updateCard(
  id: string,
  values: Pick<Card, 'word' | 'phonetic' | 'definition' | 'example'>,
) {
  ready();
  db.runSync(
    'UPDATE cards SET word = ?, phonetic = ?, definition = ?, example = ? WHERE id = ?',
    [values.word.trim(), values.phonetic.trim(), values.definition.trim(), values.example.trim(), id],
  );
}

export function deleteCard(id: string) {
  ready();
  db.runSync('DELETE FROM cards WHERE id = ?', [id]);
}

export function toggleCardStarred(id: string) {
  ready();
  db.runSync('UPDATE cards SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE id = ?', [id]);
}

export function recordStudyAttempt(cardId: string, mode: string, isCorrect: boolean) {
  ready();
  const now = Date.now();
  db.runSync(
    'INSERT INTO study_attempts (id, card_id, mode, is_correct, created_at) VALUES (?, ?, ?, ?, ?)',
    [newId(), cardId, mode, isCorrect ? 1 : 0, now],
  );
  db.runSync(
    `UPDATE cards
     SET mastery_level = CASE
       WHEN ? = 1 THEN MIN(mastery_level + 1, 5)
       ELSE MAX(mastery_level - 1, 0)
     END
     WHERE id = ?`,
    [isCorrect ? 1 : 0, cardId],
  );
}

export function getStudySummary(): StudySummary {
  ready();
  const counts = db.getFirstSync<{
    deckCount: number;
    cardCount: number;
    starredCount: number;
    masteredCount: number;
    attemptCount: number;
    correctCount: number;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM decks) AS deckCount,
      (SELECT COUNT(*) FROM cards) AS cardCount,
      (SELECT COUNT(*) FROM cards WHERE is_starred = 1) AS starredCount,
      (SELECT COUNT(*) FROM cards WHERE mastery_level >= 3) AS masteredCount,
      (SELECT COUNT(*) FROM study_attempts) AS attemptCount,
      (SELECT COUNT(*) FROM study_attempts WHERE is_correct = 1) AS correctCount
  `)!;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
  const recent = db.getAllSync<{ day: string; attempts: number }>(
    "SELECT date(created_at / 1000, 'unixepoch', 'localtime') AS day, COUNT(*) AS attempts FROM study_attempts WHERE created_at >= ? GROUP BY day",
    [weekStart],
  );
  const attemptsByDay = new Map(recent.map((row) => [row.day, row.attempts]));
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart + index * 24 * 60 * 60 * 1000);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    return {
      date: key,
      label: new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(day),
      attempts: attemptsByDay.get(key) ?? 0,
    };
  });
  const todayAttempts = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM study_attempts WHERE created_at >= ?',
    [today],
  )?.count ?? 0;

  return {
    deckCount: counts.deckCount,
    cardCount: counts.cardCount,
    starredCount: counts.starredCount,
    masteredCount: counts.masteredCount,
    todayAttempts,
    weekAttempts: week.reduce((sum, day) => sum + day.attempts, 0),
    accuracy: counts.attemptCount ? Math.round((counts.correctCount / counts.attemptCount) * 100) : 0,
    week,
  };
}

export function getRecentAttempts(limit = 8): RecentAttempt[] {
  ready();
  return db.getAllSync<RecentAttempt>(`
    SELECT a.id, c.word, a.mode, a.is_correct, a.created_at
    FROM study_attempts a
    INNER JOIN cards c ON c.id = a.card_id
    ORDER BY a.created_at DESC
    LIMIT ?
  `, [limit]);
}

export function getSetting(key: string, fallback = ''): string {
  ready();
  return db.getFirstSync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key])?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
  ready();
  db.runSync(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}
