import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesSpeech, normalizeSpeech } from '../src/speech-utils.ts';

test('normalizes capitalization, surrounding punctuation, whitespace and hyphens', () => {
  assert.equal(normalizeSpeech('  PAPER–CUT!  '), 'paper cut');
  assert.equal(normalizeSpeech(' “Beautiful.” '), 'beautiful');
  assert.equal(matchesSpeech('paper-cut', 'Paper cut.'), true);
  assert.equal(matchesSpeech('cut out', 'CUT   OUT!'), true);
});

test('matches the complete target, never an incidental word within a sentence', () => {
  assert.equal(matchesSpeech('want', 'I want an apple.'), false);
  assert.equal(matchesSpeech('apple', 'pineapple'), false);
  assert.equal(matchesSpeech('listen', 'listen to'), false);
  assert.equal(matchesSpeech('listen to', 'listen'), false);
  assert.equal(matchesSpeech('went', 'go'), false);
  assert.equal(matchesSpeech('some', 'some some'), false);
});

test('recognizes textbook country and TV aliases without accepting unrelated phrases', () => {
  for (const transcript of ['the US', 'the U S', 'the U.S.', 'the United States']) {
    assert.equal(matchesSpeech('the US', transcript), true, transcript);
  }
  for (const transcript of ['the UK', 'the U K', 'the U.K.', 'the United Kingdom']) {
    assert.equal(matchesSpeech('the UK', transcript), true, transcript);
  }
  for (const transcript of ['TV', 'T V', 'T.V.', 'television']) {
    assert.equal(matchesSpeech('TV', transcript), true, transcript);
  }
  assert.equal(matchesSpeech('the UK', 'the United States'), false);
  assert.equal(matchesSpeech('TV', 'watch television'), false);
});

test('supports clock punctuation while keeping negated words distinct', () => {
  assert.equal(matchesSpeech("o'clock", 'o clock'), true);
  assert.equal(matchesSpeech("o'clock", 'o’clock'), true);
  assert.equal(matchesSpeech("can't", 'can’t'), true);
  assert.equal(matchesSpeech("can't", 'can'), false);
  assert.equal(matchesSpeech('can', "can't"), false);
  assert.equal(matchesSpeech('can', 'cannot'), false);
});

test('empty or punctuation-only input never earns a correct answer', () => {
  assert.equal(matchesSpeech('', ''), false);
  assert.equal(matchesSpeech('apple', ''), false);
  assert.equal(matchesSpeech('apple', '…'), false);
  assert.equal(matchesSpeech('…', '…'), false);
});
