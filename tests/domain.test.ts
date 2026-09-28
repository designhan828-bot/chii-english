import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  canCheckIn, checkIn, completeGrammar, createInitialState, ensureDay,
  getDayProgress, getStreak, localDate, recordAttempt, sanitizeState,
} from '../src/domain.ts';
import type { AppState, WordEntry } from '../src/domain.ts';

const entries = JSON.parse(readFileSync(new URL('../content/vocabulary/jijiao-g5-upper-photo.json', import.meta.url), 'utf8')).entries as WordEntry[];
const DAY = '2026-09-28';
const id = entries[0].id;
const start = (date = DAY, list = entries) => ensureDay(createInitialState(), list, date);

function attempt(state: AppState, wordId: string, outcome: 'correct' | 'incorrect' | 'self' = 'correct', date = DAY): AppState {
  return recordAttempt(state, { wordId, outcome, date, attemptId: `attempt-${state.attemptIds.length}-${date}-${wordId}` });
}

function finishWords(state: AppState, date = DAY): AppState {
  return [...state.days[date].newWordIds, ...state.days[date].reviewWordIds]
    .reduce((next, wordId) => attempt(next, wordId, 'self', date), state);
}

test('the real 80-entry textbook yields 20 ordered new words in four groups of five', () => {
  const state = start();
  assert.equal(entries.length, 80);
  assert.deepEqual(state.days[DAY].newWordIds, entries.slice(0, 20).map((entry) => entry.id));
  assert.equal(state.days[DAY].reviewWordIds.length, 0);
  assert.deepEqual(getDayProgress(state, DAY), {
    newDone: 0, newTotal: 20, reviewDone: 0, reviewTotal: 0,
    grammarDone: false, canCheckIn: false, checkedIn: false,
  });
  assert.equal(ensureDay(state, [...entries].reverse(), DAY).days[DAY], state.days[DAY]);
});

test('a day and its review snapshot remain stable while learning and mastering words', () => {
  let state = attempt(start(), id);
  assert.equal(state.days[DAY].reviewWordIds.length, 0);
  state = ensureDay(state, entries, '2026-09-29');
  assert.deepEqual(state.days['2026-09-29'].reviewWordIds, [id]);
  assert.equal(state.days['2026-09-29'].newWordIds[0], entries[1].id);
  state = attempt(state, id, 'correct', '2026-09-29');
  state = attempt(state, id, 'correct', '2026-09-29');
  state = attempt(state, entries[1].id, 'self', '2026-09-29');
  assert.deepEqual(state.days['2026-09-29'].reviewWordIds, [id]);
  assert.equal(getDayProgress(state, '2026-09-29').reviewDone, 1);
  state = ensureDay(state, entries, '2026-09-30');
  assert.deepEqual(state.days['2026-09-30'].reviewWordIds, [entries[1].id]);
});

test('unpracticed assignments roll forward instead of silently consuming the textbook', () => {
  let state = start();
  state = attempt(state, entries[3].id, 'incorrect');
  state = ensureDay(state, entries, '2026-09-29');
  assert.deepEqual(state.days['2026-09-29'].newWordIds,
    entries.filter((entry) => entry.id !== entries[3].id).slice(0, 20).map((entry) => entry.id));
  assert.deepEqual(state.days['2026-09-29'].reviewWordIds, [entries[3].id]);
});

test('adding the New Concept books preserves saved progress and schedules new material after the school book', () => {
  const extensions = JSON.parse(readFileSync(new URL('../content/vocabulary/new-concept-junior-draft.json', import.meta.url), 'utf8')).entries as WordEntry[];
  const expanded = [...entries, ...extensions];
  let state = attempt(start(), id);
  const originalPlan = state.days[DAY];
  state = ensureDay(sanitizeState(JSON.parse(JSON.stringify(state)), expanded), expanded, DAY);
  assert.deepEqual(state.days[DAY], originalPlan);
  assert.equal(state.words[id].consecutiveCorrect, 1);
  assert.equal(state.vocabularyIds.length, expanded.length);
  for (const word of entries) state = attempt(state, word.id, 'self');
  state = ensureDay(state, expanded, '2026-09-29');
  assert.deepEqual(state.days['2026-09-29'].newWordIds, extensions.slice(0, 20).map(word => word.id));
  assert.equal(state.days['2026-09-29'].reviewWordIds.length, entries.length);
  const practicedExtension = state.days['2026-09-29'].newWordIds[0];
  state = attempt(state, practicedExtension, 'self', '2026-09-29');
  assert.equal(getDayProgress(state, '2026-09-29').newDone, 1);
});

test('only three consecutive recognized correct attempts earn mastery; mistakes reset', () => {
  let state = start();
  state = attempt(state, id);
  state = attempt(state, id);
  assert.equal(state.words[id].consecutiveCorrect, 2);
  assert.equal(state.words[id].mastered, false);
  state = attempt(state, id, 'incorrect');
  assert.equal(state.words[id].consecutiveCorrect, 0);
  assert.equal(getDayProgress(state, DAY).newDone, 1);
  for (let index = 0; index < 3; index++) state = attempt(state, id);
  assert.equal(state.words[id].mastered, true);
  assert.equal(state.words[id].consecutiveCorrect, 3);
  state = attempt(state, id);
  assert.equal(state.words[id].consecutiveCorrect, 3);
  state = attempt(state, id, 'incorrect');
  assert.equal(state.words[id].consecutiveCorrect, 0);
  assert.equal(state.words[id].mastered, true, 'voluntary relearning does not revoke earned mastery');
});

test('self practice satisfies daily practice but never awards speech correctness or mastery', () => {
  let state = start();
  for (let index = 0; index < 6; index++) state = attempt(state, id, 'self');
  assert.equal(state.words[id].consecutiveCorrect, 0);
  assert.equal(state.words[id].mastered, false);
  assert.equal(state.words[id].attempts, 6);
  assert.equal(getDayProgress(state, DAY).newDone, 1);
  state = attempt(state, id);
  state = attempt(state, id, 'self');
  assert.equal(state.words[id].consecutiveCorrect, 1, 'self practice neither guesses correctness nor treats recognition absence as failure');
});

test('recording IDs are idempotent even if resubmitted for a different word or date', () => {
  let state = recordAttempt(start(), { wordId: id, outcome: 'correct', date: DAY, attemptId: 'recording-1' });
  const previous = state;
  state = recordAttempt(state, { wordId: id, outcome: 'correct', date: DAY, attemptId: 'recording-1' });
  assert.equal(state, previous);
  assert.equal(recordAttempt(state, { wordId: entries[1].id, outcome: 'correct', date: DAY, attemptId: 'recording-1' }), state);
  state = ensureDay(state, entries, '2026-09-29');
  assert.equal(recordAttempt(state, { wordId: id, outcome: 'correct', date: '2026-09-29', attemptId: 'recording-1' }), state);
});

test('foreign and unassigned words cannot be used to manufacture 20/20 progress', () => {
  let state = start();
  assert.equal(attempt(state, 'not-in-catalog'), state);
  assert.equal(attempt(state, '__proto__'), state);
  for (const entry of entries.slice(20, 50)) state = attempt(state, entry.id);
  assert.equal(Object.keys(state.words).length, 30, 'optional known words still record their own practice');
  assert.equal(getDayProgress(state, DAY).newDone, 0);
  assert.equal(state.days[DAY].reviewWordIds.length, 0);
  state = completeGrammar(state, DAY);
  assert.equal(canCheckIn(state, DAY), false);
});

test('check-in requires all three tasks and is an idempotent explicit action', () => {
  let state = start();
  assert.equal(checkIn(state, DAY), state);
  state = finishWords(state);
  assert.equal(canCheckIn(state, DAY), false);
  assert.equal(getStreak(state, DAY), 0);
  state = completeGrammar(state, DAY);
  assert.equal(canCheckIn(state, DAY), true);
  assert.equal(getStreak(state, DAY), 0);
  state = checkIn(state, DAY);
  assert.equal(getStreak(state, DAY), 1);
  assert.equal(getDayProgress(state, DAY).checkedIn, true);
  assert.equal(canCheckIn(state, DAY), false);
  assert.equal(checkIn(state, DAY), state);
  assert.equal(state.checkIns.length, 1);

  state = ensureDay(state, entries, '2026-09-29');
  for (const wordId of state.days['2026-09-29'].newWordIds) state = attempt(state, wordId, 'self', '2026-09-29');
  state = completeGrammar(state, '2026-09-29');
  assert.equal(canCheckIn(state, '2026-09-29'), false, 'yesterday’s unmastered words remain required');
  for (const wordId of state.days['2026-09-29'].reviewWordIds) state = attempt(state, wordId, 'incorrect', '2026-09-29');
  assert.equal(canCheckIn(state, '2026-09-29'), true, 'a useful review attempt need not be correct');
});

test('a short remaining batch and a review-only day can both complete', () => {
  const small = entries.slice(0, 3);
  let state = start(DAY, small);
  assert.equal(getDayProgress(state, DAY).newTotal, 3);
  state = checkIn(completeGrammar(finishWords(state), DAY), DAY);
  state = ensureDay(state, small, '2026-09-29');
  assert.equal(getDayProgress(state, '2026-09-29').newTotal, 0);
  assert.equal(getDayProgress(state, '2026-09-29').reviewTotal, 3);
  state = finishWords(state, '2026-09-29');
  state = completeGrammar(state, '2026-09-29');
  assert.equal(canCheckIn(state, '2026-09-29'), true);
});

test('an exhausted and mastered catalog needs only grammar, without inventing new words', () => {
  let state = start(DAY, entries.slice(0, 1));
  for (let index = 0; index < 3; index++) state = attempt(state, id);
  state = ensureDay(state, entries.slice(0, 1), '2026-09-29');
  assert.equal(getDayProgress(state, '2026-09-29').newTotal, 0);
  assert.equal(getDayProgress(state, '2026-09-29').reviewTotal, 0);
  assert.equal(canCheckIn(completeGrammar(state, '2026-09-29'), '2026-09-29'), true);
});

test('streaks survive year and leap-day boundaries but reset after a missed day', () => {
  const state = createInitialState();
  state.checkIns = ['2025-12-30', '2025-12-31', '2026-01-01'];
  assert.equal(getStreak(state, '2026-01-01'), 3);
  assert.equal(getStreak(state, '2026-01-02'), 3);
  assert.equal(getStreak(state, '2026-01-03'), 0);
  state.checkIns.push('2026-01-03');
  assert.equal(getStreak(state, '2026-01-03'), 1);
  state.checkIns = ['2024-02-28', '2024-02-29', '2024-03-01'];
  assert.equal(getStreak(state, '2024-03-02'), 3);
});

test('calendar arithmetic handles daylight-saving transitions without subtracting 24 hours', () => {
  const state = createInitialState();
  state.checkIns = ['2026-03-07', '2026-03-08', '2026-03-09'];
  assert.equal(getStreak(state, '2026-03-10'), 3);
  state.checkIns = ['2026-10-31', '2026-11-01', '2026-11-02'];
  assert.equal(getStreak(state, '2026-11-03'), 3);
  assert.equal(localDate(new Date(2026, 8, 28, 0, 15)), DAY);
  assert.equal(localDate(new Date(2026, 8, 28, 23, 59)), DAY);
  assert.throws(() => localDate(new Date('invalid')), RangeError);
});

test('invalid dates, absent plans and stale previous-day callbacks cannot mutate progress', () => {
  let state = start();
  assert.equal(ensureDay(state, entries, '2026-02-30'), state);
  assert.equal(ensureDay(state, entries, '28-09-2026'), state);
  assert.equal(attempt(state, id, 'correct', '2026-09-29'), state);
  state = ensureDay(state, entries, '2026-09-29');
  assert.equal(attempt(state, id, 'correct', DAY), state);
  assert.equal(completeGrammar(state, DAY), state);
  assert.equal(checkIn(state, DAY), state);
  assert.equal(ensureDay(state, entries, '2026-09-27'), state);
  assert.equal(getDayProgress(createInitialState(), DAY).canCheckIn, false);
});

test('learning is immutable and serialized progress resumes without losing idempotency', () => {
  const initial = start();
  const before = JSON.stringify(initial);
  let state = attempt(initial, id);
  assert.equal(JSON.stringify(initial), before);
  state = finishWords(state);
  state = checkIn(completeGrammar(state, DAY), DAY);
  const loaded = sanitizeState(JSON.parse(JSON.stringify(state)), entries);
  assert.deepEqual(loaded, state);
  assert.equal(recordAttempt(loaded, {
    wordId: id, date: DAY, outcome: 'correct', attemptId: state.attemptIds[0],
  }), loaded);
});

test('invalid saved data is discarded while trustworthy partial progress is preserved', () => {
  const state = attempt(start(), id);
  const raw = JSON.parse(JSON.stringify(state));
  raw.words.bad = { wordId: 'bad', mastered: true, attempts: 300 };
  raw.words[entries[1].id] = { ...raw.words[id], wordId: entries[1].id, consecutiveCorrect: 99 };
  raw.days[DAY].newWordIds.push(id, 'bad');
  raw.days[DAY].reviewWordIds = [id, 'bad'];
  raw.days[DAY].practicedWordIds.push('bad', entries[1].id);
  raw.days['2026-02-30'] = { ...raw.days[DAY], date: '2026-02-30' };
  raw.checkIns = [DAY, DAY, '2026-02-30'];
  raw.attemptIds.push(raw.attemptIds[0], null, '');
  const loaded = sanitizeState(raw, entries);
  assert.equal(Object.keys(loaded.words).length, 1);
  assert.deepEqual(loaded.days[DAY].practicedWordIds, [id]);
  assert.equal(loaded.days[DAY].newWordIds.length, 20);
  assert.deepEqual(loaded.days[DAY].reviewWordIds, []);
  assert.equal(loaded.days['2026-02-30'], undefined);
  assert.deepEqual(loaded.checkIns, []);
  assert.equal(loaded.attemptIds.length, 1);
  for (const invalid of [null, [], 'oops', { schemaVersion: 0 }]) {
    assert.deepEqual(sanitizeState(invalid, entries), { ...createInitialState(), vocabularyIds: entries.map((entry) => entry.id) });
  }
});

test('duplicate catalog entries do not inflate daily totals', () => {
  const state = start(DAY, [entries[0], entries[0], entries[1]]);
  assert.equal(state.vocabularyIds.length, 2);
  assert.equal(getDayProgress(state, DAY).newTotal, 2);
});
