import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STATE,
  normalizeState,
  loadState,
  saveState,
  updateComponent,
  safeStorage,
} from '../src/state.js';

test('defaults expose versioned editable content and person mode', () => {
  assert.equal(DEFAULT_STATE.version, 1);
  assert.equal(DEFAULT_STATE.photoMode, 'person');
  assert.equal(DEFAULT_STATE.components.title.text, '我的 AI 云栖时刻');
  assert.equal(DEFAULT_STATE.components.title.color, undefined);
});

test('normalizeState restores defaults for invalid values without sharing references', () => {
  const first = normalizeState(null);
  const second = normalizeState({ version: 'wrong', components: [] });
  first.components.title.text = 'changed';

  assert.equal(second.components.title.text, '我的 AI 云栖时刻');
  assert.notEqual(first.components, second.components);
});

test('normalizeState preserves supported photo mode and caps editable text at 120 characters', () => {
  const state = normalizeState({
    version: 1,
    photoMode: 'empty',
    components: {
      title: { text: '云'.repeat(180), x: 9, y: 10, hidden: false },
    },
  });

  assert.equal(state.photoMode, 'empty');
  assert.equal(state.components.title.text.length, 120);
  assert.equal(state.components.title.x, 9);
});

test('loadState handles malformed storage JSON and wrong schema types', () => {
  const malformed = { getItem: () => '{bad json' };
  const wrongSchema = { getItem: () => JSON.stringify({ version: 99, components: 'bad' }) };

  assert.deepEqual(loadState(malformed), normalizeState(null));
  assert.deepEqual(loadState(wrongSchema), normalizeState(null));
});

test('updateComponent is immutable and ignores unknown component ids', () => {
  const original = normalizeState(null);
  const changed = updateComponent(original, 'title', { text: '新的标题', x: 12 });
  const ignored = updateComponent(original, 'does-not-exist', { text: 'x' });

  assert.equal(original.components.title.text, '我的 AI 云栖时刻');
  assert.equal(changed.components.title.text, '新的标题');
  assert.equal(changed.components.title.x, 12);
  assert.deepEqual(ignored, original);
  assert.notEqual(changed, original);
});

test('saveState returns false when storage writes fail and true on success', () => {
  const state = normalizeState(null);
  const failing = { setItem: () => { throw new Error('quota'); } };
  let saved = '';
  const working = { setItem: (_key, value) => { saved = value; } };

  assert.equal(saveState(failing, state), false);
  assert.equal(saveState(working, state), true);
  assert.equal(JSON.parse(saved).version, 1);
});

test('safeStorage converts a throwing browser storage getter into an unavailable store', () => {
  const environment = {};
  Object.defineProperty(environment, 'localStorage', {
    get() { throw new DOMException('blocked', 'SecurityError'); },
  });

  assert.equal(safeStorage(environment), null);
  assert.deepEqual(loadState(safeStorage(environment)), normalizeState(null));
  assert.equal(saveState(safeStorage(environment), normalizeState(null)), false);
});
