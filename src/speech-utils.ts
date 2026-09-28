/** Normalize a whole utterance, never a substring of it. */
export function normalizeSpeech(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[’‘ʼ`]/g, "'")
    .replace(/\bo\s*'\s*clock\b/g, 'o clock')
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/(^|\s)'|'(?=\s|$)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const equivalentTerms = [
  ['the us', 'the u s', 'the united states'],
  ['the uk', 'the u k', 'the united kingdom'],
  ['tv', 't v', 'television'],
];

/** A transcript must match the entire target or an explicit textbook alias. */
export function matchesSpeech(target: string, transcript: string): boolean {
  const expected = normalizeSpeech(target);
  const spoken = normalizeSpeech(transcript);
  if (!expected || !spoken) return false;
  if (expected === spoken) return true;
  return equivalentTerms.some((terms) => terms.includes(expected) && terms.includes(spoken));
}
