/* Run: npm run db:seed            -> admin user + default lists
 *      npm run db:seed -- --demo  -> also adds sample cars, customers, bookings (for testing only) */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db, schema } from '../src/db';
import { newBookingId, newCustomerId, newMaintenanceId, newExpenseId, newPaymentId } from '../src/lib/ids';

const LOOKUPS: Record<string, string[]> = {
  CAR_CATEGORY: ['Sedan', 'SUV', 'Hatchback', 'Crossover', 'Van', 'Pickup', 'Luxury'],
  MAINT_TYPE: ['Oil change', 'Tuning', 'Brakes', 'Battery', 'Tyres', 'Service', 'Body work', 'AC', 'Other'],
  DAMAGE_TYPE: ['Scratch', 'Dent', 'Glass', 'Tyre', 'Accident', 'Interior', 'Other'],
  EXPENSE_CATEGORY: ['Salaries', 'Rent', 'Utilities', 'Fuel', 'Driver pay', 'Investor payout', 'Marketing', 'Office', 'Other'],
  BOOKING_TYPE: ['Self-drive', 'With driver', 'Out-of-city', 'Wedding / event', 'Airport pick & drop'],
};

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'code.7motors@gmail.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || '';
  const [{ users }] = await db.select({ users: sql<number>`count(*)::int` }).from(schema.users);
  if (users === 0) {
    // Refuse weak or example passwords for the first admin account.
    if (password.length < 10 || password === 'Admin@12345' || /choose-a-strong-password/i.test(password)) {
      console.error('Set SEED_ADMIN_PASSWORD in .env to a strong password (10+ characters, not the example) and run again.');
      process.exit(1);
    }
    await db.insert(schema.users).values({ name: 'Admin', email, passwordHash: await bcrypt.hash(password, 10), role: 'ADMIN' }).onConflictDoNothing();
    console.log(`Admin account created: ${email} (password from SEED_ADMIN_PASSWORD)`);
  } else {
    console.log('Users already exist — admin account left unchanged.');
  }
  for (const [kind, names] of Object.entries(LOOKUPS)) {
    for (const name of names) await db.insert(schema.lookups).values({ kind, name }).onConflictDoNothing();
  }
  const settings = { business_name: 'Seven Motors', fine_grace_hours: '1', default_investor_share: '50', agreement_terms:
    '1. The customer is responsible for the vehicle until it is returned and received by the office.\n2. Late return is charged at the vehicle rate per 12 hours / day after the grace period.\n3. Any damage, traffic challan or fine during the rental period is paid by the customer.\n4. Fuel must be returned at the same level as taken.\n5. The vehicle may not be sub-let or driven outside the agreed area without permission.' };
  for (const [key, value] of Object.entries(settings)) await db.insert(schema.settings).values({ key, value }).onConflictDoNothing();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.locations);
  if (n === 0) await db.insert(schema.locations).values([{ name: 'Islamabad', city: 'Islamabad' }, { name: 'Lahore', city: 'Lahore' }, { name: 'Rawalpindi', city: 'Rawalpindi' }]);

  if (process.argv.includes('--demo')) {
    if (process.env.NODE_ENV === 'production') { console.error('Demo data is not allowed with NODE_ENV=production.'); process.exit(1); }
    await demo();
  }
  process.exit(0);
}

async function demo() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.vehicles);
  if (n > 0) { console.log('Demo skipped: vehicles already exist'); return; }
  const [inv] = await db.insert(schema.investors).values({ name: 'Bilal', phone: '03196623771', cnic: '34102-4235789-5', address: 'Sadokey', sharePercent: '50' }).returning();
  const cars = await db.insert(schema.vehicles).values([
    { model: 'Toyota Corolla 2023', regNo: 'LEA-1234', color: 'White', category: 'Sedan', rateDay: 9000, rate12h: 5500, meterReading: 42000, investorId: inv.id },
    { model: 'Honda Civic 2026', regNo: 'ICT-255', color: 'Black', category: 'Sedan', rateDay: 12000, rate12h: 7000, meterReading: 8000 },
    { model: 'Toyota Fortuner', regNo: 'LEA-4406', color: 'Grey', category: 'SUV', rateDay: 22000, rate12h: 13000, meterReading: 61000, investorId: inv.id },
    { model: 'Suzuki Cultus', regNo: 'RIZ-122', color: 'Silver', category: 'Hatchback', rateDay: 5000, rate12h: 3000, meterReading: 75000 },
    { model: 'BYD Dolphin', regNo: 'BYD-177', color: 'Blue', category: 'Hatchback', rateDay: 15000, rate12h: 9000, meterReading: 3000 },
  ]).returning();
  const custs = [
    { id: newCustomerId(), name: 'Samiullah', phone: '03246778888', email: 'sahib@gmail.com', cnic: '34567-8976543-5', address: 'Lahore' },
    { id: newCustomerId() + '1', name: 'Farhan', phone: '03010000000', email: 'farhan@gmail.com', cnic: '35202-1111111-1', address: 'Islamabad', isCredit: true, creditLimit: 300000 },
  ];
  await db.insert(schema.customers).values(custs);
  const [drv] = await db.insert(schema.drivers).values({ name: 'Ali Khan', age: 32, cnic: '35202-2222222-2', licenseNo: 'LHR-778899', phone: '03001234567', paymentBasis: 'PER_BOOKING', perDayFee: 2500 }).returning();
  const D = 86400000, now = Date.now();
  const mk = (i: number, car: typeof cars[number], cust: string, startOff: number, days: number, status: string, driver?: number) => {
    const rent = car.rateDay * days, drvAmt = driver ? 2500 * days : 0;
    return { id: newBookingId().slice(0, -1) + i, customerId: cust, vehicleId: car.id, driverId: driver ?? null, locationId: 1, bookingType: driver ? 'With driver' : 'Self-drive', durationType: 'DAY', startAt: new Date(now + startOff * D), endAt: new Date(now + (startOff + days) * D), fuelOut: 'Full', meterOut: car.meterReading, rentAmount: rent, driverAmount: drvAmt, totalAmount: rent + drvAmt, advanceAmount: 5000, status };
  };
  const bks = [
    mk(1, cars[0], custs[0].id, -10, 3, 'COMPLETED'),
    mk(2, cars[2], custs[1].id, -2, 4, 'IN_PROGRESS', drv.id),
    mk(3, cars[1], custs[0].id, 2, 2, 'CONFIRMED'),
    mk(4, cars[3], custs[1].id, -3, 2, 'IN_PROGRESS'),
  ];
  await db.insert(schema.bookings).values(bks);
  for (const b of bks) await db.insert(schema.payments).values({ id: newPaymentId() + b.id.slice(-1), bookingId: b.id, customerId: b.customerId, amount: 5000, type: 'ADVANCE', method: 'Cash', paidAt: b.startAt });
  await db.insert(schema.receivings).values({ bookingId: bks[0].id, receivedAt: bks[0].endAt, meterIn: 42900, fuelIn: 'Full', fine: 0 });
  await db.insert(schema.payments).values({ id: newPaymentId() + 'X', bookingId: bks[0].id, customerId: bks[0].customerId, amount: bks[0].totalAmount - 5000, type: 'RENT', method: 'Cash', paidAt: bks[0].endAt });
  await db.insert(schema.maintenance).values({ id: newMaintenanceId(), vehicleId: cars[0].id, types: ['Oil change', 'Brakes'], date: new Date(now - 5 * D).toISOString().slice(0, 10), cost: 18000, meterReading: 42900, nextOilChangeKm: 47900, status: 'COMPLETED' });
  await db.insert(schema.expenses).values({ id: newExpenseId(), date: new Date().toISOString().slice(0, 10), category: 'Rent', description: 'Office rent', amount: 60000 });
  console.log('Demo data added');
}

main().catch((e) => { console.error(e); process.exit(1); });
