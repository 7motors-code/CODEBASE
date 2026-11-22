import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { sign, verify, cookieOpts, SESSION_COOKIE, PORTAL_COOKIE } from '../../src/lib/session';

test('Session: sign and verify create valid cryptographic tokens', async () => {
  const payload = {
    id: 1,
    name: 'Admin User',
    email: 'admin@7motors.pk',
    role: 'ADMIN',
    pv: 'a1b2c3d4e5f60718'
  };

  const token = await sign(payload, 7);
  assert.ok(typeof token === 'string' && token.length > 50);

  const verified = await verify<typeof payload>(token);
  assert.ok(verified);
  assert.equal(verified.id, 1);
  assert.equal(verified.name, 'Admin User');
  assert.equal(verified.email, 'admin@7motors.pk');
  assert.equal(verified.role, 'ADMIN');
  assert.equal(verified.pv, 'a1b2c3d4e5f60718');
});

test('Session: verify rejects tampered tokens', async () => {
  const payload = { id: 2, name: 'Attacker', email: 'bad@bad.com', role: 'ADMIN' };
  const token = await sign(payload, 7);
  const tampered = token.slice(0, -6) + 'XXXXXX';
  const result = await verify(tampered);
  assert.equal(result, null);
  assert.equal(await verify(''), null);
  assert.equal(await verify(undefined), null);
});

test('Session: cookieOpts generates secure options', () => {
  const opts = cookieOpts(7);
  assert.equal(opts.httpOnly, true);
  assert.equal(opts.sameSite, 'lax');
  assert.equal(opts.path, '/');
  assert.equal(opts.maxAge, 7 * 86400);

  assert.equal(SESSION_COOKIE, 'sm_session');
  assert.equal(PORTAL_COOKIE, 'sm_portal');
});
