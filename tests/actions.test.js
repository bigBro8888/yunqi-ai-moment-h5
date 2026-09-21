import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chooseShareAction,
  editableText,
  serializeExportName,
  readImageFile,
  liveEditableText,
} from '../src/actions.js';

test('chooseShareAction prefers native share then clipboard then manual copy', () => {
  assert.equal(chooseShareAction({ share: true, clipboard: true }), 'share');
  assert.equal(chooseShareAction({ share: false, clipboard: true }), 'clipboard');
  assert.equal(chooseShareAction({}), 'manual');
});

test('editableText normalizes empty values and caps long content', () => {
  assert.equal(editableText(null), '');
  assert.equal(editableText('  云栖时刻  '), '云栖时刻');
  assert.equal(editableText('A'.repeat(200), 120).length, 120);
});

test('liveEditableText preserves intentional leading and trailing spaces while typing', () => {
  assert.equal(liveEditableText('Hello ', 120), 'Hello ');
  assert.equal(liveEditableText(' A B ', 4), ' A B');
});

test('serializeExportName strips unsafe characters and uses deterministic date suffix', () => {
  const now = new Date('2026-09-20T08:30:00Z');
  assert.equal(serializeExportName('我的/AI:*云栖?时刻', now), '我的-AI--云栖-时刻-20260920.png');
  assert.equal(serializeExportName('', now), 'yunqi-ai-moment-20260920.png');
});

test('readImageFile rejects non-image uploads with a Chinese message', async () => {
  await assert.rejects(
    readImageFile({ type: 'text/plain', size: 10 }),
    /请选择 JPG、PNG 或 WebP 图片/,
  );
});

test('readImageFile rejects images larger than 8MB with a Chinese message', async () => {
  await assert.rejects(
    readImageFile({ type: 'image/png', size: 8 * 1024 * 1024 + 1 }),
    /图片不能超过 8MB/,
  );
});
