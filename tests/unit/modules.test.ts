import test from 'node:test';
import assert from 'node:assert/strict';
import { MODULE_KEYS, ROLES, defaultPerm } from '../../src/lib/modules';

test('Modules: defines all 15 admin modules and core roles', () => {
  assert.equal(MODULE_KEYS.length, 15);
  assert.ok(MODULE_KEYS.includes('dashboard'));
  assert.ok(MODULE_KEYS.includes('cars'));
  assert.ok(MODULE_KEYS.includes('bookings'));
  assert.ok(MODULE_KEYS.includes('receiving'));
  assert.ok(MODULE_KEYS.includes('maintenance'));
  assert.ok(MODULE_KEYS.includes('damage'));
  assert.ok(MODULE_KEYS.includes('drivers'));
  assert.ok(MODULE_KEYS.includes('customers'));
  assert.ok(MODULE_KEYS.includes('users'));
  assert.ok(MODULE_KEYS.includes('investors'));
  assert.ok(MODULE_KEYS.includes('payments'));
  assert.ok(MODULE_KEYS.includes('expenses'));
  assert.ok(MODULE_KEYS.includes('reports'));
  assert.ok(MODULE_KEYS.includes('locations'));
  assert.ok(MODULE_KEYS.includes('devRequests'));

  assert.ok(ROLES.includes('ADMIN'));
  assert.ok(ROLES.includes('MANAGER'));
  assert.ok(ROLES.includes('STAFF'));
  assert.ok(ROLES.includes('ACCOUNTANT'));
});

test('Modules: defaultPerm grants ADMIN full access across all modules', () => {
  for (const m of MODULE_KEYS) {
    const p = defaultPerm('ADMIN', m);
    assert.deepEqual(p, { view: true, create: true, edit: true, delete: true });
  }
});

test('Modules: defaultPerm configures role-specific access', () => {
  // Staff cannot delete cars or view investor payouts
  const staffCars = defaultPerm('STAFF', 'cars');
  assert.equal(staffCars.view, true);
  assert.equal(staffCars.delete, false);

  const staffInvestors = defaultPerm('STAFF', 'investors');
  assert.equal(staffInvestors.view, false);

  // Accountant can view payments, expenses, reports
  const accPayments = defaultPerm('ACCOUNTANT', 'payments');
  assert.equal(accPayments.view, true);
  assert.equal(accPayments.create, true);

  const accReports = defaultPerm('ACCOUNTANT', 'reports');
  assert.equal(accReports.view, true);
});
