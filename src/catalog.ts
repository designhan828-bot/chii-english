import jijiaoPhoto from '../content/vocabulary/jijiao-g5-upper-photo.json';
import newConcept from '../content/vocabulary/new-concept-junior-draft.json';
import type { WordEntry } from './domain';

/** Register only checked, available books. Source entry IDs remain stable across updates. */
export interface VocabularyBank {
  id: string;
  title: string;
  shortTitle: string;
  priority: number;
  sourceTitle: string;
  isComplete: boolean;
  coverageNote: string;
  unitTitles: Record<number, string | null>;
  entries: readonly WordEntry[];
}

export interface CatalogWord extends WordEntry {
  bookId: string;
  bookTitle: string;
}

export const vocabularyBanks: readonly VocabularyBank[] = [
  {
    id: 'jijiao-g5-upper',
    title: '冀教版五年级上册',
    shortTitle: '冀教五上',
    priority: 10,
    sourceTitle: '冀教版（三年级起点）五年级上册 · Unit 1 School clubs',
    isComplete: jijiaoPhoto.coverage.isCompleteTextbookList,
    coverageNote: '当前已核对提供的教材词表照片；整册词表仍在补全核对中。',
    unitTitles: { 1: 'School clubs', 2: 'Sports games and safety', 3: 'A better me', 4: 'Countries', 5: 'Cities and hometowns', 6: 'What a wonderful trip!' },
    entries: jijiaoPhoto.entries,
  },
  ...newConcept.books.map((book, index) => ({
    id: book.id,
    title: book.title,
    shortTitle: `新概念 ${index === 0 ? '1A' : '1B'}`,
    priority: 20 + index,
    sourceTitle: `${book.title} · Unit ${book.unitStart}–${book.unitEnd}`,
    isComplete: false,
    coverageNote: '覆盖本册全部单元的词汇整理稿，来源为公开词表转录；待原书逐页核对。',
    unitTitles: Object.fromEntries(newConcept.units.filter(unit => unit.bookId === book.id).map(unit => [unit.number, unit.title])),
    entries: newConcept.entries.filter(entry => entry.bookId === book.id),
  })),
];

const availableBanks = vocabularyBanks.filter(bank => bank.entries.length > 0)
  .sort((a, b) => a.priority - b.priority);
const bankById = new Map(availableBanks.map(bank => [bank.id, bank]));

/** Daily new-word plans consume this order: school textbook first, then extensions. */
export const words: CatalogWord[] = availableBanks.flatMap(bank => bank.entries.map(entry => ({
  ...entry,
  bookId: bank.id,
  bookTitle: bank.title,
})));

export const bookOptions = availableBanks.map(bank => ({
  id: bank.id,
  title: bank.title,
  shortTitle: bank.shortTitle,
  sourceTitle: bank.sourceTitle,
  entryCount: bank.entries.length,
  isComplete: bank.isComplete,
  coverageNote: bank.coverageNote,
}));

export function getWordBookLabel(word: Pick<CatalogWord, 'bookId'>, short = false): string {
  const bank = bankById.get(word.bookId);
  return bank ? short ? bank.shortTitle : bank.title : '英语词库';
}

export function getWordUnitLabel(word: Pick<CatalogWord, 'bookId' | 'unit'>): string {
  const title = bankById.get(word.bookId)?.unitTitles[word.unit];
  return `Unit ${word.unit}${title ? ` · ${title}` : ''}`;
}
