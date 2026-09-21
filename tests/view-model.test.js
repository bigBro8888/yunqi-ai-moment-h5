import test from 'node:test';
import assert from 'node:assert/strict';
import { componentInlineStyle, buildStageSvg } from '../src/view-model.js';

test('componentInlineStyle explicitly clears optional inline styles after reset', () => {
  assert.deepEqual(componentInlineStyle({}), { fontSize: '', color: '', textAlign: '' });
  assert.deepEqual(
    componentInlineStyle({ fontSize: 42, color: '#123456', align: 'right' }),
    { fontSize: '42px', color: '#123456', textAlign: 'right' },
  );
});

test('buildStageSvg preserves the complete cloned composition and embedded styles', () => {
  const svg = buildStageSvg(
    '<article class="stage"><p>品牌文案</p><div class="holo-ring"></div></article>',
    '.holo-ring{animation:ring 12s linear infinite}',
    941,
    1672,
  );
  assert.match(svg, /品牌文案/);
  assert.match(svg, /holo-ring/);
  assert.match(svg, /animation:ring/);
  assert.match(svg, /width="941" height="1672"/);
});
