import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newBookingId,
  newGroupId,
  newCustomerId,
  newPaymentId,
  newExpenseId,
  newMaintenanceId,
  newDamageId
} from '../../src/lib/ids';

test('IDs: generates correctly formatted IDs matching PRD standards', () => {
  // Booking ID: BK-YYYYMMDDHHMMSS-XXXX (hex)
  const bId = newBookingId();
  assert.match(bId, /^BK-\d{14}-[0-9A-F]{4}$/);

  // Group ID: GRP-YYYYMMDDHHMMSS
  const gId = newGroupId();
  assert.match(gId, /^GRP-\d{14}$/);

  // Customer ID: C + YYYYMMDDHHMMSS + XXXX (hex)
  const cId = newCustomerId();
  assert.match(cId, /^C\d{14}[0-9A-F]{4}$/);

  // Payment ID: PAY-YYYYMMDDHHMMSS-XXXX
  const pId = newPaymentId();
  assert.match(pId, /^PAY-\d{14}-[0-9A-F]{4}$/);

  // Expense ID: EXP-YYYYMMDDHHMM-XXXX (12 digits timestamp)
  const eId = newExpenseId();
  assert.match(eId, /^EXP-\d{12}-[0-9A-F]{4}$/);

  // Maintenance ID: MT-YYYYMMDDHHMM-XXXX (12 digits timestamp)
  const mId = newMaintenanceId();
  assert.match(mId, /^MT-\d{12}-[0-9A-F]{4}$/);

  // Damage ID: DMG-YYYYMMDDHHMM-XXXX (12 digits timestamp)
  const dId = newDamageId();
  assert.match(dId, /^DMG-\d{12}-[0-9A-F]{4}$/);
});
