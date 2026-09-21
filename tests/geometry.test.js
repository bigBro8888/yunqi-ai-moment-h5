import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fitStage,
  clampPosition,
  positionFromPointer,
} from '../src/geometry.js';

test('fitStage scales a portrait design inside a phone viewport', () => {
  const fit = fitStage(390, 844, 941, 1672);
  assert.equal(fit.scale, 390 / 941);
  assert.equal(fit.width, 390);
  assert.ok(fit.height < 844);
  assert.equal(fit.left, 0);
  assert.ok(fit.top > 0);
});

test('fitStage centers the design on desktop without stretching', () => {
  const fit = fitStage(1440, 1000, 941, 1672);
  assert.equal(fit.scale, 1000 / 1672);
  assert.equal(fit.height, 1000);
  assert.ok(fit.left > 400);
  assert.equal(fit.top, 0);
});

test('fitStage returns finite zeros for an empty viewport', () => {
  const fit = fitStage(0, Number.NaN, 941, 1672);
  assert.deepEqual(fit, { scale: 0, width: 0, height: 0, left: 0, top: 0 });
});

test('positionFromPointer respects scale and where the component was grabbed', () => {
  const result = positionFromPointer(
    { x: 150, y: 260 },
    { left: 50, top: 60 },
    { x: 20, y: 30 },
    0.5,
  );
  assert.deepEqual(result, { x: 180, y: 370 });
});

test('positionFromPointer handles invalid scale without non-finite output', () => {
  const result = positionFromPointer({ x: 10, y: 20 }, { left: 0, top: 0 }, { x: 3, y: 4 }, 0);
  assert.deepEqual(result, { x: 7, y: 16 });
});

test('clampPosition keeps a component fully inside stage bounds', () => {
  assert.deepEqual(
    clampPosition({ x: -20, y: 1800 }, { width: 941, height: 1672 }, { width: 100, height: 50 }),
    { x: 0, y: 1622 },
  );
  assert.deepEqual(
    clampPosition({ x: 500, y: 700 }, { width: 941, height: 1672 }, { width: 100, height: 50 }),
    { x: 500, y: 700 },
  );
});
