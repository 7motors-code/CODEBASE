import test from 'node:test';
import assert from 'node:assert/strict';
import { passwordVersion, oneOf, safeBack } from '../../src/lib/security';

test('Security: passwordVersion generates deterministic 16-character hash slice', () => {
  // Synthetic test fixtures, not real credentials
  const hash1 = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  const pv1 = passwordVersion(hash1);
  const pv2 = passwordVersion(hash1);
  assert.equal(pv1.length, 16);
  assert.equal(pv1, pv2);

  const hash2 = '$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789012345';
  const pv3 = passwordVersion(hash2);
  assert.notEqual(pv1, pv3);
});

test('Security: oneOf safely restricts input to whitelist', () => {
  const allowed = ['AVAILABLE', 'MAINTENANCE', 'BOOKED'] as const;
  assert.equal(oneOf('AVAILABLE', allowed, 'AVAILABLE'), 'AVAILABLE');
  assert.equal(oneOf('MAINTENANCE', allowed, 'AVAILABLE'), 'MAINTENANCE');
  assert.equal(oneOf('HACKED', allowed, 'AVAILABLE'), 'AVAILABLE');
  assert.equal(oneOf(null, allowed, 'AVAILABLE'), 'AVAILABLE');
  assert.equal(oneOf(undefined, allowed, 'AVAILABLE'), 'AVAILABLE');
});

test('Security: safeBack prevents Open Redirect attacks', () => {
  // Safe relative paths allowed
  assert.equal(safeBack('/admin/bookings', '/admin'), '/admin/bookings');
  assert.equal(safeBack('/admin/cars?edit=1', '/admin'), '/admin/cars?edit=1');

  // Protocol-relative paths blocked
  assert.equal(safeBack('//evil.com', '/admin'), '/admin');
  assert.equal(safeBack('///evil.com', '/admin'), '/admin');

  // Absolute URLs blocked
  assert.equal(safeBack('https://evil.com', '/admin'), '/admin');
  assert.equal(safeBack('http://evil.com/admin', '/admin'), '/admin');
  assert.equal(safeBack('javascript:alert(1)', '/admin'), '/admin');
  assert.equal(safeBack('', '/admin'), '/admin');
  assert.equal(safeBack(null, '/admin'), '/admin');

  // Whitespace and control characters blocked
  assert.equal(safeBack('/admin\n/evil.com', '/admin'), '/admin');
  assert.equal(safeBack('/admin\t/test', '/admin'), '/admin');
  assert.equal(safeBack('/ admin', '/admin'), '/admin');
});
