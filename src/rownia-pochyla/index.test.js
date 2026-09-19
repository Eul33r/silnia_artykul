const test = require('node:test');
const assert = require('node:assert/strict');

const {
  inferTriangle,
  calculateWeight,
  calculateForceComponents,
  evaluateStaticFriction,
  calculateMotion,
} = require('./index.js');

test('inferTriangle resolves missing height and base from length and angle', () => {
  const result = inferTriangle({ length: 5, angleDeg: 30 });

  assert.ok(Math.abs(result.height - 2.5) < 1e-9);
  assert.ok(Math.abs(result.base - 5 * Math.cos(Math.PI / 6)) < 1e-9);
  assert.ok(Math.abs(result.angleDeg - 30) < 1e-9);
});

test('inferTriangle rejects impossible geometric data', () => {
  assert.throws(() => inferTriangle({ length: 3, height: 10 }), /impossible|invalid/i);
});

test('calculateWeight and force components produce correct incline values', () => {
  const result = calculateForceComponents({ mass: 10, gravity: 9.81, angleDeg: 30 });
  const expectedPerpendicular = 98.1 * Math.cos(Math.PI / 6);

  assert.ok(Math.abs(result.weight - 98.1) < 1e-9);
  assert.ok(Math.abs(result.parallel - 49.05) < 1e-9);
  assert.ok(Math.abs(result.perpendicular - expectedPerpendicular) < 1e-9);
  assert.ok(Math.abs(result.normal - expectedPerpendicular) < 1e-9);
});

test('evaluateStaticFriction blocks motion when tangent is too small', () => {
  const result = evaluateStaticFriction({
    mass: 10,
    gravity: 9.81,
    angleDeg: 10,
    muStatic: 0.5,
  });

  assert.equal(result.canMove, false);
  assert.ok(result.reason.includes('nie rusza') || result.reason.includes('does not move'));
});

test('calculateMotion handles non-zero initial velocity', () => {
  const result = calculateMotion({ initialVelocity: 2, acceleration: 3, time: 4 });

  assert.ok(Math.abs(result.distance - 32) < 1e-9);
  assert.ok(Math.abs(result.finalVelocity - 14) < 1e-9);
});
