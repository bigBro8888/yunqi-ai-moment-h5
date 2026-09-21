import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('page declares mobile metadata, share controls, and stable component ids', async () => {
  const html = await read('index.html');
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /<title>我的 AI 云栖时刻/);
  assert.match(html, /class="stage"/);
  assert.match(html, /id="share-button"/);
  assert.match(html, /id="share-sheet"/);
  assert.doesNotMatch(html, /id="editor-toggle"/);
  assert.doesNotMatch(html, /id="editor-panel"/);

  for (const id of ['title', 'subtitle', 'share', 'support', 'slogan']) {
    assert.match(html, new RegExp(`data-component-id="${id}"`));
  }
});

test('page contains motion layers and all seven capability labels', async () => {
  const html = await read('index.html');
  for (const className of ['holo-ring', 'title-orbit', 'sparkle', 'particle-field']) {
    assert.match(html, new RegExp(className));
  }
  for (const label of ['RFID精准感知', '智慧展厅', '空间智能运营', 'IoT智能硬件', '现场签到识别', '访客轨迹洞察', '展项智能联动']) {
    assert.match(html, new RegExp(label));
  }
});

test('orbital accents keep their geometry fixed and animate only short light segments', async () => {
  const html = await read('index.html');
  const css = await read('styles.css');

  assert.match(html, /<ellipse class="orbit-track"/);
  assert.match(html, /<ellipse class="orbit-flow"/);
  assert.match(html, /<svg class="holo-ring ring-one"/);
  assert.match(html, /<ellipse class="ring-flow"/);
  assert.match(css, /@keyframes orbit-flow[\s\S]*stroke-dashoffset/);
  assert.match(css, /@keyframes ring-flow[\s\S]*stroke-dashoffset/);
  assert.doesNotMatch(css, /@keyframes\s+(?:orbit-drift|ring-spin-one|ring-spin-two)/);
});

test('local image assets exist and markup has no external runtime assets', async () => {
  const html = await read('index.html');
  const css = await read('styles.css');
  const background = await stat(new URL('../assets/back1.png', import.meta.url));
  assert.ok(background.size > 100_000);
  assert.match(html, /src="\.\/assets\/back1\.png(?:\?[^"]*)?"/);
  assert.doesNotMatch(html, /yunqi-person\.png|yunqi-empty\.png|top-rebuild|bottom-rebuild/);
  assert.doesNotMatch(css, /\.top-rebuild|\.bottom-rebuild/);
  assert.doesNotMatch(html, /<(?:script|link|img)[^>]+(?:src|href)="https?:\/\//i);
});

test('styles provide safe areas, focus visibility, reduced transparency, contrast, and static reduced motion', async () => {
  const css = await read('styles.css');
  assert.match(css, /env\(safe-area-inset-top/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation(?:-name)?:\s*none\s*!important/);
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
  assert.match(css, /prefers-contrast:\s*more/);
});

test('main module consumes state, geometry, and actions and wires share export', async () => {
  const source = await read('src/main.js');
  assert.match(source, /from '\.\/state\.js(?:\?[^']*)?'/);
  assert.match(source, /from '\.\/geometry\.js(?:\?[^']*)?'/);
  assert.match(source, /from '\.\/actions\.js(?:\?[^']*)?'/);
  assert.match(source, /imageUrl/);
  assert.match(source, /toBlob|toDataURL/);
  assert.match(source, /cloneNode\(true\)/);
  assert.match(source, /buildStageSvg/);
  assert.doesNotMatch(source, /editor-toggle/);
  assert.doesNotMatch(source, /function drawText/);
});

test('poster export paints images on the canvas instead of nesting them in the svg overlay', async () => {
  const source = await read('src/main.js');
  assert.match(source, /extractPosterLayers/);
  assert.match(source, /copies\[index\]\.remove\(\)/);
  assert.match(source, /drawPosterLayer/);
  assert.doesNotMatch(source, /copies\[index\]\.src/);
});
