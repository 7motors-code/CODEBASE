import test from 'node:test';
import assert from 'node:assert/strict';
import { rentFor, lateFine, V_STATUS_LABEL } from '../../src/lib/calc';

test('Calc: rentFor calculates 24-hour day rentals correctly', () => {
  const vehicle = { rateDay: 6000, rate12h: 3500 };
  const start = new Date('2026-11-22T10:00:00Z');

  // Exactly 24 hours -> 1 day
  const end24h = new Date('2026-11-23T10:00:00Z');
  const r1 = rentFor(vehicle, 'DAY', start, end24h);
  assert.equal(r1.units, 1);
  assert.equal(r1.rent, 6000);

  // 24.5 hours -> rounds up to 2 days
  const end25h = new Date('2026-11-23T10:30:00Z');
  const r2 = rentFor(vehicle, 'DAY', start, end25h);
  assert.equal(r2.units, 2);
  assert.equal(r2.rent, 12000);

  // Exactly 48 hours -> 2 days
  const end48h = new Date('2026-11-24T10:00:00Z');
  const r3 = rentFor(vehicle, 'DAY', start, end48h);
  assert.equal(r3.units, 2);
  assert.equal(r3.rent, 12000);

  // 0 or negative hours -> 0 units, 0 rent
  const r0 = rentFor(vehicle, 'DAY', start, start);
  assert.equal(r0.units, 0);
  assert.equal(r0.rent, 0);
});

test('Calc: rentFor calculates 12-hour shift rentals correctly', () => {
  const vehicle = { rateDay: 6000, rate12h: 3500 };
  const start = new Date('2026-11-22T08:00:00Z');

  // Exactly 12 hours -> 1 shift
  const end12h = new Date('2026-11-22T20:00:00Z');
  const r1 = rentFor(vehicle, '12H', start, end12h);
  assert.equal(r1.units, 1);
  assert.equal(r1.rent, 3500);

  // 12 hours 15 mins -> rounds up to 2 shifts
  const end13h = new Date('2026-11-22T20:15:00Z');
  const r2 = rentFor(vehicle, '12H', start, end13h);
  assert.equal(r2.units, 2);
  assert.equal(r2.rent, 7000);
});

test('Calc: lateFine charges extra time beyond grace period', () => {
  const vehicle = { rateDay: 8000, rate12h: 5000 };
  const endAt = new Date('2026-11-22T12:00:00Z');

  // Within 1 hour grace period -> no fine
  const receivedWithinGrace = new Date('2026-11-22T12:45:00Z');
  const f1 = lateFine(vehicle, 'DAY', endAt, receivedWithinGrace, 1);
  assert.equal(f1.fine, 0);
  assert.equal(f1.lateHours, 0);

  // Exactly at 1 hour grace -> no fine
  const receivedAtGrace = new Date('2026-11-22T13:00:00Z');
  const f2 = lateFine(vehicle, 'DAY', endAt, receivedAtGrace, 1);
  assert.equal(f2.fine, 0);

  // 2 hours late (1 hour past grace) with DAY duration -> 1 day fine
  const receivedLateDay = new Date('2026-11-22T14:00:00Z');
  const f3 = lateFine(vehicle, 'DAY', endAt, receivedLateDay, 1);
  assert.equal(f3.fine, 8000);
  assert.equal(f3.lateHours, 2);

  // 2 hours late (1 hour past grace) with 12H duration -> 1 shift fine
  const f4 = lateFine(vehicle, '12H', endAt, receivedLateDay, 1);
  assert.equal(f4.fine, 5000);
  assert.equal(f4.lateHours, 2);
});

test('Calc: V_STATUS_LABEL matches PRD status names', () => {
  assert.equal(V_STATUS_LABEL.AVAILABLE, 'Available');
  assert.equal(V_STATUS_LABEL.RESERVED, 'Reserved');
  assert.equal(V_STATUS_LABEL.BOOKED, 'Rented');
  assert.equal(V_STATUS_LABEL.RETURN, 'Return');
  assert.equal(V_STATUS_LABEL.MAINTENANCE, 'Maintenance');
});
