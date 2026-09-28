/** Pure learning rules. Dates are local calendar keys, never elapsed 24-hour periods. */
export const DAILY_NEW_TARGET = 20;
export const WORDS_PER_STAGE = 5;

export interface WordEntry {
  id: string;
  unit: number;
  word: string;
  meaningZh: string;
  lessonPage: number | null;
  kind: string;
  lemma: string;
  [key: string]: unknown;
}

export interface WordProgress {
  wordId: string;
  consecutiveCorrect: number;
  mastered: boolean;
  attempts: number;
  firstPracticedOn: string;
  lastPracticedOn: string;
}

export interface DailyPlan {
  date: string;
  newWordIds: string[];
  reviewWordIds: string[];
  practicedWordIds: string[];
  grammarDone: boolean;
}

export interface AppState {
  schemaVersion: 1;
  vocabularyIds: string[];
  days: Record<string, DailyPlan>;
  words: Record<string, WordProgress>;
  attemptIds: string[];
  checkIns: string[];
}

export interface Attempt {
  wordId: string;
  outcome: 'correct' | 'incorrect' | 'self';
  attemptId: string;
  date: string;
}

export interface DayProgress {
  newDone: number;
  newTotal: number;
  reviewDone: number;
  reviewTotal: number;
  grammarDone: boolean;
  canCheckIn: boolean;
  checkedIn: boolean;
}

export function createInitialState(): AppState {
  return {
    schemaVersion: 1,
    vocabularyIds: [],
    days: {},
    words: {},
    attemptIds: [],
    checkIns: [],
  };
}

export function localDate(now = new Date()): string {
  if (!Number.isFinite(now.getTime())) throw new RangeError('Invalid learning date');
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T12:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function previousDate(date: string): string {
  const calendar = new Date(`${date}T12:00:00.000Z`);
  calendar.setUTCDate(calendar.getUTCDate() - 1);
  return calendar.toISOString().slice(0, 10);
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 256
    && !['__proto__', 'constructor', 'prototype'].includes(value);
}

function uniqueIds(values: unknown, allowed?: Set<string>): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((id): id is string => isId(id) && (!allowed || allowed.has(id))))];
}

function catalogIds(entries: WordEntry[]): string[] {
  return uniqueIds(entries.map((entry) => entry.id));
}

function latestDate(state: AppState): string | undefined {
  return Object.keys(state.days).sort().at(-1);
}

/** Freeze a day's assignments on first opening. Unpracticed words remain eligible tomorrow. */
export function ensureDay(state: AppState, entries: WordEntry[], date: string): AppState {
  if (!isDate(date)) return state;
  const vocabularyIds = catalogIds(entries);
  const catalogChanged = vocabularyIds.length !== state.vocabularyIds.length
    || vocabularyIds.some((id, index) => id !== state.vocabularyIds[index]);
  const updated = catalogChanged ? { ...state, vocabularyIds } : state;
  if (updated.days[date]) return updated;
  // A stale tab must not generate a retroactive plan using today's word progress.
  const latest = latestDate(updated);
  if (latest && date < latest) return updated;
  const newWordIds = vocabularyIds.filter((id) => !updated.words[id]).slice(0, DAILY_NEW_TARGET);
  const reviewWordIds = vocabularyIds.filter((id) => {
    const progress = updated.words[id];
    return progress && !progress.mastered && progress.firstPracticedOn < date;
  });
  return {
    ...updated,
    days: {
      ...updated.days,
      [date]: { date, newWordIds, reviewWordIds, practicedWordIds: [], grammarDone: false },
    },
  };
}

/** A recording ID is consumed once, across all dates, words, and outcomes. */
export function recordAttempt(state: AppState, attempt: Attempt): AppState {
  const { wordId, outcome, attemptId, date } = attempt;
  if (!isDate(date) || !state.days[date] || date !== latestDate(state)
    || !isId(attemptId) || state.attemptIds.includes(attemptId)
    || !state.vocabularyIds.includes(wordId)
    || !['correct', 'incorrect', 'self'].includes(outcome)) return state;
  const previous = state.words[wordId];
  const consecutiveCorrect = outcome === 'incorrect' ? 0
    : outcome === 'correct' ? Math.min(3, (previous?.consecutiveCorrect ?? 0) + 1)
      : previous?.consecutiveCorrect ?? 0;
  const progress: WordProgress = {
    wordId,
    consecutiveCorrect,
    // Mastery is earned by recognized attempts and is not automatically revoked.
    mastered: previous?.mastered === true || (outcome === 'correct' && consecutiveCorrect === 3),
    attempts: (previous?.attempts ?? 0) + 1,
    firstPracticedOn: previous?.firstPracticedOn ?? date,
    lastPracticedOn: date,
  };
  const plan = state.days[date];
  const assigned = plan.newWordIds.includes(wordId) || plan.reviewWordIds.includes(wordId);
  const practicedWordIds = assigned && !plan.practicedWordIds.includes(wordId)
    ? [...plan.practicedWordIds, wordId] : plan.practicedWordIds;
  return {
    ...state,
    words: { ...state.words, [wordId]: progress },
    attemptIds: [...state.attemptIds, attemptId],
    days: practicedWordIds === plan.practicedWordIds ? state.days : {
      ...state.days,
      [date]: { ...plan, practicedWordIds },
    },
  };
}

export function completeGrammar(state: AppState, date: string): AppState {
  const plan = state.days[date];
  if (!plan || !isDate(date) || date !== latestDate(state) || plan.grammarDone) return state;
  return { ...state, days: { ...state.days, [date]: { ...plan, grammarDone: true } } };
}

export function getDayProgress(state: AppState, date: string): DayProgress {
  const plan = isDate(date) ? state.days[date] : undefined;
  const practiced = new Set(plan?.practicedWordIds ?? []);
  const newTotal = plan?.newWordIds.length ?? 0;
  const reviewTotal = plan?.reviewWordIds.length ?? 0;
  const newDone = plan?.newWordIds.filter((id) => practiced.has(id)).length ?? 0;
  const reviewDone = plan?.reviewWordIds.filter((id) => practiced.has(id)).length ?? 0;
  const grammarDone = plan?.grammarDone === true;
  const checkedIn = state.checkIns.includes(date);
  return {
    newDone, newTotal, reviewDone, reviewTotal, grammarDone, checkedIn,
    canCheckIn: !!plan && date === latestDate(state) && !checkedIn && grammarDone
      && newDone === newTotal && reviewDone === reviewTotal,
  };
}

export function canCheckIn(state: AppState, date: string): boolean {
  return getDayProgress(state, date).canCheckIn;
}

export function checkIn(state: AppState, date: string): AppState {
  if (!canCheckIn(state, date)) return state;
  return { ...state, checkIns: [...state.checkIns, date].sort() };
}

/** Before today's check-in, yesterday's uninterrupted streak remains visible. */
export function getStreak(state: AppState, date: string): number {
  if (!isDate(date)) return 0;
  const checked = new Set(state.checkIns);
  let cursor = checked.has(date) ? date : previousDate(date);
  let count = 0;
  while (checked.has(cursor)) {
    count += 1;
    cursor = previousDate(cursor);
  }
  return count;
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** Validate local storage / imported backups without trusting counts or foreign IDs. */
export function sanitizeState(value: unknown, entries: WordEntry[]): AppState {
  const initial = createInitialState();
  initial.vocabularyIds = catalogIds(entries);
  if (!object(value) || value.schemaVersion !== 1) return initial;
  const allowed = new Set(initial.vocabularyIds);
  const words: Record<string, WordProgress> = {};
  if (object(value.words)) {
    for (const [id, raw] of Object.entries(value.words)) {
      if (!allowed.has(id) || !object(raw) || raw.wordId !== id
        || !nonnegativeInteger(raw.attempts) || raw.attempts < 1
        || !nonnegativeInteger(raw.consecutiveCorrect) || raw.consecutiveCorrect > 3
        || raw.consecutiveCorrect > raw.attempts || typeof raw.mastered !== 'boolean'
        || (raw.mastered && raw.attempts < 3)
        || !isDate(raw.firstPracticedOn) || !isDate(raw.lastPracticedOn)
        || raw.firstPracticedOn > raw.lastPracticedOn) continue;
      words[id] = {
        wordId: id,
        attempts: raw.attempts,
        consecutiveCorrect: raw.consecutiveCorrect,
        mastered: raw.mastered,
        firstPracticedOn: raw.firstPracticedOn,
        lastPracticedOn: raw.lastPracticedOn,
      };
    }
  }
  const days: Record<string, DailyPlan> = {};
  if (object(value.days)) {
    for (const [date, raw] of Object.entries(value.days)) {
      if (!isDate(date) || !object(raw) || raw.date !== date) continue;
      const newWordIds = uniqueIds(raw.newWordIds, allowed).slice(0, DAILY_NEW_TARGET);
      const newSet = new Set(newWordIds);
      const reviewWordIds = uniqueIds(raw.reviewWordIds, allowed).filter((id) => !newSet.has(id));
      const assigned = new Set([...newWordIds, ...reviewWordIds]);
      const practicedWordIds = uniqueIds(raw.practicedWordIds, assigned).filter((id) => {
        const word = words[id];
        return word && word.firstPracticedOn <= date && word.lastPracticedOn >= date;
      });
      days[date] = { date, newWordIds, reviewWordIds, practicedWordIds, grammarDone: raw.grammarDone === true };
    }
  }
  const checkIns = uniqueIds(value.checkIns).filter((date) => {
    const day = days[date];
    if (!isDate(date) || !day?.grammarDone) return false;
    const practiced = new Set(day.practicedWordIds);
    return [...day.newWordIds, ...day.reviewWordIds].every((id) => practiced.has(id));
  }).sort();
  return {
    schemaVersion: 1,
    vocabularyIds: initial.vocabularyIds,
    words, days, checkIns,
    attemptIds: uniqueIds(value.attemptIds),
  };
}
