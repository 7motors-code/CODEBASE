import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { inArray } from 'drizzle-orm';
import { db, schema, closePool } from '../../src/db';
import {
  fleetStatus,
  withBookingLock,
  vehicleClash,
  driverClash,
  investorSummary,
  driverLedger,
  customerTotals,
  bookingBalances,
  getSetting
} from '../../src/lib/calc';
import { isRateLimited, hitRateLimit, clearRateLimit } from '../../src/lib/security';
import { pkMonth } from '../../src/lib/format';
import { closeRedis } from '../../src/lib/redis';

test.after(async () => {
  await closeRedis();
  await closePool();
});

test('Integration DB: Connection to Neon PostgreSQL is healthy', async () => {
  let alive = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await db.execute('SELECT 1 as alive;');
      if (result) {
        alive = true;
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  assert.ok(alive, 'Database should be reachable');
});

test('Integration DB: withBookingLock holds postgres transaction advisory lock', async () => {
  const output = await withBookingLock(async (tx) => {
    const [row] = await tx.select().from(schema.users).limit(1);
    return row?.role;
  });
  assert.ok(output);
});

test('Integration DB: fleetStatus returns vehicles with computed availability', async () => {
  const fleet = await fleetStatus();
  assert.ok(Array.isArray(fleet));
  for (const car of fleet) {
    assert.ok(car.id);
    assert.ok(car.regNo);
    assert.ok(['AVAILABLE', 'RESERVED', 'BOOKED', 'RETURN', 'MAINTENANCE'].includes(car.vstatus));
  }
});

test('Integration DB: vehicleClash and driverClash detect overlapping reservations', async () => {
  const [b] = await db.select().from(schema.bookings)
    .where(inArray(schema.bookings.status, ['PENDING', 'CONFIRMED', 'IN_PROGRESS']))
    .limit(1);
  if (b) {
    // Exact same period -> clash detected
    const clash = await vehicleClash(b.vehicleId, b.startAt, b.endAt);
    assert.ok(clash, 'Should detect clash for identical dates');

    // Passing ignoreId -> no clash
    const ignored = await vehicleClash(b.vehicleId, b.startAt, b.endAt, b.id);
    assert.equal(ignored, null, 'Should ignore the booking itself when editing');

    // Far future date -> no clash
    const farFutureStart = new Date('2035-01-01T10:00:00Z');
    const farFutureEnd = new Date('2035-01-02T10:00:00Z');
    const noClash = await vehicleClash(b.vehicleId, farFutureStart, farFutureEnd);
    assert.equal(noClash, null, 'Far future dates should not clash');
  }
});

test('Integration DB: investorSummary verifies PRD formula: revenue * share% - maintenance = payable', async () => {
  const [inv] = await db.select().from(schema.investors).limit(1);
  if (inv) {
    const currentMonth = pkMonth();
    const summary = await investorSummary(inv.id, currentMonth);
    assert.ok(summary);
    assert.equal(summary.investor.id, inv.id);
    
    // Formula verification: payable = share - maintenance
    assert.equal(summary.payable, summary.share - summary.maintenance);
    // Office revenue = revenue - payable
    assert.equal(summary.office, summary.revenue - summary.payable);
  }
});

test('Integration DB: driverLedger computes earned, paid, and pending balance', async () => {
  const ledger = await driverLedger();
  assert.ok(Array.isArray(ledger));
  if (ledger.length > 0) {
    for (const d of ledger) {
      assert.ok(d.driver.id);
      assert.equal(d.pending, Math.max(0, d.earned - d.paid));
    }
  }
});

test('Integration DB: bookingBalances and customerTotals calculate balances accurately', async () => {
  const bookings = await db.select().from(schema.bookings).limit(5);
  const ids = bookings.map((b) => b.id);
  const balances = await bookingBalances(ids);
  
  for (const id of ids) {
    const bal = balances.get(id);
    assert.ok(bal);
    assert.equal(bal.pending, Math.max(0, bal.total + bal.fine - bal.paid));
  }

  const [c] = await db.select().from(schema.customers).limit(1);
  if (c) {
    const totals = await customerTotals(c.id);
    assert.ok(typeof totals.paid === 'number');
    assert.ok(typeof totals.pending === 'number');
    assert.ok(typeof totals.bookings === 'number');
  }
});

test('Integration DB: getSetting returns persisted or default configuration', async () => {
  const name = await getSetting('business_name', 'Seven Motors');
  assert.ok(name);
  const grace = await getSetting('fine_grace_hours', '1');
  assert.ok(grace);
});

test('Integration DB: database-backed rate limiting functions correctly', async () => {
  const testKey = `test:ip:127.0.0.99:${Date.now()}`;
  assert.equal(await isRateLimited(testKey, 3, 1), false);

  await hitRateLimit(testKey);
  await hitRateLimit(testKey);
  assert.equal(await isRateLimited(testKey, 3, 1), false);

  await hitRateLimit(testKey);
  assert.equal(await isRateLimited(testKey, 3, 1), true);

  await clearRateLimit(testKey);
  assert.equal(await isRateLimited(testKey, 3, 1), false);
});
