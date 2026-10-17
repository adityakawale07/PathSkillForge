import test from 'node:test';
import assert from 'node:assert/strict';
import { selectContext } from './ai-context.js';
test('short material remains complete', () => {
  assert.equal(selectContext('Short document', 'document'), 'Short document');
});
test('large documents fit the input budget and include later passages', () => {
  const text = 'a'.repeat(70000) + 'FINAL_CHAPTER';
  const result = selectContext(text);
  assert.ok(result.length <= 18000);
  assert.ok(result.includes('FINAL_CHAPTER'));
});
test('question-specific passages beyond the old cutoff are included', () => {
  const text = 'a'.repeat(64500) + ' photosynthesis chlorophyll '.repeat(40) + 'b'.repeat(20000);
  assert.ok(selectContext(text, 'Explain photosynthesis chlorophyll').includes('photosynthesis'));
});
