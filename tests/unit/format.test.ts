import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pkr,
  fmtDate,
  fmtDateTime,
  fmtTime,
  parsePk,
  pkParts,
  pkDay,
  pkInput,
  pkMonth,
  dayRange,
  monthRange,
  addMonths,
  monthLabel,
  int,
  str,
  TZ
} from '../../src/lib/format';

test('Format: pkr formats currency in Pakistani Rupees', () => {
  assert.equal(pkr(0), 'PKR 0');
  assert.equal(pkr(5000), 'PKR 5,000');
  assert.equal(pkr(1234567), 'PKR 1,234,567');
  assert.equal(pkr(1234.56), 'PKR 1,235'); // rounded
  assert.equal(pkr(-2500), 'PKR -2,500');
  assert.equal(pkr(null), 'PKR 0');
  assert.equal(pkr(undefined), 'PKR 0');
});

test('Format: parsePk and date parts in Pakistan Standard Time (UTC+05:00)', () => {
  assert.equal(TZ, 'Asia/Karachi');
  
  // Date-only parse
  const d1 = parsePk('2026-11-22');
  assert.ok(d1);
  assert.equal(d1.toISOString(), '2026-11-21T19:00:00.000Z'); // 00:00 PKT is 19:00 UTC previous day

  // Datetime-local parse
  const d2 = parsePk('2026-11-22T14:30');
  assert.ok(d2);
  assert.equal(d2.toISOString(), '2026-11-22T09:30:00.000Z'); // 14:30 PKT is 09:30 UTC

  // Invalid strings return null
  assert.equal(parsePk(''), null);
  assert.equal(parsePk(null), null);
  assert.equal(parsePk('not-a-date'), null);

  // pkParts & pkDay
  const parts = pkParts(d2);
  assert.equal(parts.y, 2026);
  assert.equal(parts.m, 11);
  assert.equal(parts.d, 22);
  assert.equal(parts.h, 14);
  assert.equal(parts.min, 30);
  assert.equal(pkDay(d2), '2026-11-22');
  assert.equal(pkInput(d2), '2026-11-22T14:30');
  assert.equal(pkMonth(d2), '2026-11');
});

test('Format: fmtDate, fmtDateTime, fmtTime format output cleanly', () => {
  const d = parsePk('2026-11-22T15:45')!;
  assert.equal(fmtDate(d), '22/11/2026');
  assert.ok(fmtDateTime(d).includes('22/11/2026'));
  assert.ok(fmtDateTime(d).includes('03:45 pm') || fmtDateTime(d).includes('03:45 PM') || fmtDateTime(d).includes('3:45 pm'));
  assert.ok(fmtTime(d).includes('03:45 pm') || fmtTime(d).includes('03:45 PM') || fmtTime(d).includes('3:45 pm'));

  // Nulls
  assert.equal(fmtDate(null), '—');
  assert.equal(fmtDateTime(null), '—');
  assert.equal(fmtTime(null), '—');
});

test('Format: dayRange and monthRange calculate exact boundary timestamps', () => {
  const { start: dStart, end: dEnd } = dayRange('2026-11-22');
  assert.equal(dStart.toISOString(), '2026-11-21T19:00:00.000Z');
  assert.equal(dEnd.toISOString(), '2026-11-22T19:00:00.000Z');
  assert.equal(dEnd.getTime() - dStart.getTime(), 86400000); // 24 hours

  const { start: mStart, end: mEnd } = monthRange('2026-11');
  assert.equal(mStart.toISOString(), '2026-10-31T19:00:00.000Z');
  assert.equal(mEnd.toISOString(), '2026-11-30T19:00:00.000Z'); // 30 days in November
});

test('Format: addMonths and monthLabel handle year wrapping', () => {
  assert.equal(addMonths('2026-11', 1), '2026-12');
  assert.equal(addMonths('2026-11', 2), '2027-01');
  assert.equal(addMonths('2026-01', -1), '2025-12');
  assert.equal(addMonths('2026-12', 12), '2027-12');

  assert.equal(monthLabel('2026-11'), 'Nov 2026');
  assert.equal(monthLabel('2027-01'), 'Jan 2027');
});

test('Format: int and str safely handle user/form inputs', () => {
  assert.equal(int('1,500'), 1500);
  assert.equal(int('  25000  '), 25000);
  assert.equal(int('', 42), 42);
  assert.equal(int(null, 10), 10);
  assert.equal(int('abc', 0), 0);

  assert.equal(str('  Seven Motors  '), 'Seven Motors');
  assert.equal(str(''), null);
  assert.equal(str('   '), null);
  assert.equal(str(null), null);
  assert.equal(str(undefined), null);
});
