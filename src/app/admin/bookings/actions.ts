'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { saveDataUrl, saveUpload } from '@/lib/files';
import { int, money, parsePk, str } from '@/lib/format';
import { newBookingId, newCustomerId, newGroupId, newPaymentId } from '@/lib/ids';
import { driverClash, rentFor, vehicleClash, bookingBalances, withBookingLock } from '@/lib/calc';
import { oneOf, safeBack } from '@/lib/security';

function fail(path: string, msg: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}err=${encodeURIComponent(msg)}`);
}

/** Find the customer by id, else by phone/CNIC, else create a new one */
async function upsertCustomer(fd: FormData) {
  const name = String(fd.get('customerName') ?? '').trim();
  const phone = String(fd.get('customerPhone') ?? '').replace(/\s/g, '');
  const cnic = str(fd.get('customerCnic'));
  const address = str(fd.get('customerAddress'));
  const cnicFrontId = await saveUpload(fd.get('cnicFront'));
  const cnicBackId = await saveUpload(fd.get('cnicBack'));
  let id = str(fd.get('customerId'));
  if (!id) {
    const [byPhone] = await db.select().from(schema.customers).where(eq(schema.customers.phone, phone));
    const [byCnic] = cnic ? await db.select().from(schema.customers).where(eq(schema.customers.cnic, cnic)) : [];
    id = (byCnic ?? byPhone)?.id ?? null;
  }
  if (id) {
    const [c] = await db.select().from(schema.customers).where(eq(schema.customers.id, id));
    if (c?.status === 'BLOCKED') throw new Error(`Customer ${c.name} is blocked${c.blockReason ? `: ${c.blockReason}` : ''}.`);
    await db.update(schema.customers).set({ name, phone, cnic: cnic ?? c?.cnic, address: address ?? c?.address,
      ...(cnicFrontId ? { cnicFrontId } : {}), ...(cnicBackId ? { cnicBackId } : {}) }).where(eq(schema.customers.id, id));
    return id;
  }
  id = newCustomerId();
  await db.insert(schema.customers).values({ id, name, phone, cnic, address, cnicFrontId, cnicBackId });
  await log('create', 'customer', id, name);
  return id;
}

export async function createBooking(fd: FormData) {
  const user = await requirePerm('bookings', 'create');
  const back = '/admin/bookings/new';
  const vehicleIds = fd.getAll('vehicleIds').map((v) => int(v)).filter(Boolean);
  const start = parsePk(String(fd.get('start'))), end = parsePk(String(fd.get('end')));
  if (!vehicleIds.length) fail(back, 'Select at least one vehicle.');
  if (!start || !end || end <= start) fail(back, 'End date/time must be after the start.');
  const durationType = fd.get('durationType') === '12H' ? '12H' : 'DAY';
  const driverId = int(fd.get('driverId')) || null;
  const cars = await db.select().from(schema.vehicles).where(and(inArray(schema.vehicles.id, vehicleIds), eq(schema.vehicles.active, true)));
  if (cars.length !== new Set(vehicleIds).size) fail(back, 'One of the selected vehicles no longer exists.');
  for (const c of cars) {
    const clash = await vehicleClash(c.id, start, end);
    if (clash) fail(back, `${c.model} (${c.regNo}) is already booked for these dates (${clash}).`);
  }
  if (driverId) { const clash = await driverClash(driverId, start, end); if (clash) fail(back, `This driver is already on booking ${clash} at that time.`); }

  let customerId: string;
  try { customerId = await upsertCustomer(fd); } catch (e) { fail(back, (e as Error).message); }

  const guarantorCnicId = await saveUpload(fd.get('guarantorCnicImage'));
  const signatureId = (await saveDataUrl(str(fd.get('signature')), 'signature.png')) ?? (await saveUpload(fd.get('signatureFile')));
  const thumbId = await saveUpload(fd.get('thumb'));
  const driverAmount = Math.max(0, int(fd.get('driverAmount')));
  const advance = Math.max(0, int(fd.get('advanceAmount')));
  const postedTotal = Math.max(0, int(fd.get('totalAmount')));
  const rents = cars.map((c) => rentFor(c, durationType, start, end).rent);
  const autoTotal = rents.reduce((a, b) => a + b, 0) + driverAmount;
  const overrideReason = str(fd.get('overrideReason'));
  const total = postedTotal > 0 || overrideReason ? postedTotal : autoTotal;
  if (total !== autoTotal && !overrideReason) fail(back, 'Please give a reason for changing the total.');
  if (advance > total) fail(back, 'Advance cannot be more than the total.');
  const groupId = cars.length > 1 ? newGroupId() : null;
  const status = start.getTime() <= Date.now() + 15 * 60000 ? 'IN_PROGRESS' : 'CONFIRMED';
  // The id shown on the form is used when it is well-formed; otherwise a fresh one is made on the server.
  const posted = String(fd.get('bookingId') ?? '');
  const firstId = /^BK-\d{14}-[0-9A-F]{4}$/.test(posted) ? posted : newBookingId();
  const ids: string[] = [];
  const rentSum = rents.reduce((a, b) => a + b, 0) || 1;
  const clashMsg = await withBookingLock(async (tx) => {
  // Re-check inside the lock: another booking may have been saved since the form was opened.
  for (const c of cars) { const cl = await vehicleClash(c.id, start, end, undefined, tx); if (cl) return `${c.model} (${c.regNo}) is already booked for these dates (${cl}).`; }
  if (driverId) { const cl = await driverClash(driverId, start, end, undefined, tx); if (cl) return `This driver is already on booking ${cl} at that time.`; }
  let allocated = 0;
  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    let id = i === 0 ? firstId : `${firstId.slice(0, -2)}${String(i).padStart(2, '0')}`;
    const [exists] = await tx.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.id, id));
    if (exists) id = newBookingId(); // double-submit or id collision
    // Round each car's share, but give the last car the remainder so the group adds up to the exact total.
    const share = cars.length === 1 ? total
      : i === cars.length - 1 ? total - allocated
      : Math.round(((total - driverAmount) * rents[i]) / rentSum) + (i === 0 ? driverAmount : 0);
    allocated += share;
    await tx.insert(schema.bookings).values({
      id, groupId, customerId, vehicleId: c.id, driverId: i === 0 ? driverId : null, locationId: int(fd.get('locationId')) || null,
      bookingType: str(fd.get('bookingType')), durationType, shift: durationType === '12H' ? str(fd.get('shift')) : null,
      startAt: start, endAt: end, fuelOut: str(fd.get('fuelOut')), meterOut: cars.length === 1 ? int(fd.get('meterOut'), c.meterReading) : c.meterReading,
      rentAmount: rents[i], driverAmount: i === 0 ? driverAmount : 0, totalAmount: share, advanceAmount: i === 0 ? advance : 0, status,
      guarantorName: str(fd.get('guarantorName')), guarantorPhone: str(fd.get('guarantorPhone')), guarantorCnic: str(fd.get('guarantorCnic')),
      guarantorCnicId, guarantorAddress: str(fd.get('guarantorAddress')), signatureId, thumbId, overrideReason, notes: str(fd.get('notes')), createdById: user.id,
    });
    ids.push(id);
  }
  if (advance > 0) {
    await tx.insert(schema.payments).values({ id: newPaymentId(), bookingId: ids[0], customerId, amount: advance, type: 'ADVANCE', method: String(fd.get('advanceMethod') ?? 'Cash').slice(0, 40), paidAt: new Date(), receivedById: user.id });
  }
  return null;
  });
  if (clashMsg) fail(back, clashMsg);
  await log('create', 'booking', ids.join(', '));
  revalidatePath('/admin', 'layout');
  redirect(fd.get('intent') === 'print' ? `/admin/bookings/${ids[0]}/print?auto=1` : `/admin/bookings/${ids[0]}`);
}

export async function updateBooking(fd: FormData) {
  await requirePerm('bookings', 'edit');
  const id = String(fd.get('bookingId'));
  const back = `/admin/bookings/${id}/edit`;
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
  if (!b) fail('/admin/bookings', 'Booking not found.');
  if (b.status === 'COMPLETED' || b.status === 'CANCELLED') fail(`/admin/bookings/${id}`, 'Completed or cancelled bookings cannot be edited.');
  const vehicleId = int(fd.getAll('vehicleIds')[0]);
  const start = parsePk(String(fd.get('start'))), end = parsePk(String(fd.get('end')));
  if (!vehicleId || !start || !end || end <= start) fail(back, 'Choose a vehicle and valid dates.');
  const clash = await vehicleClash(vehicleId, start, end, id);
  if (clash) fail(back, `That vehicle is already booked for these dates (${clash}).`);
  const driverId = int(fd.get('driverId')) || null;
  if (driverId) { const dc = await driverClash(driverId, start, end, id); if (dc) fail(back, `This driver is already on booking ${dc}.`); }
  const [car] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId));
  if (!car) fail(back, 'That vehicle no longer exists.');
  const durationType = fd.get('durationType') === '12H' ? '12H' : 'DAY';
  const rent = rentFor(car, durationType, start, end).rent;
  const driverAmount = Math.max(0, int(fd.get('driverAmount')));
  const auto = rent + driverAmount;
  const total = Math.max(0, int(fd.get('totalAmount'), auto));
  const overrideReason = str(fd.get('overrideReason'));
  // Every edit that moves the total away from the calculated rent needs its own reason.
  if (total !== auto && !overrideReason) fail(back, 'Please give a reason for changing the total.');
  let customerId: string;
  try { customerId = await upsertCustomer(fd); } catch (e) { fail(back, (e as Error).message); }
  const guarantorCnicId = await saveUpload(fd.get('guarantorCnicImage'));
  const clashMsg = await withBookingLock(async (tx) => {
  const vc = await vehicleClash(vehicleId, start, end, id, tx);
  if (vc) return `That vehicle is already booked for these dates (${vc}).`;
  if (driverId) { const dc = await driverClash(driverId, start, end, id, tx); if (dc) return `This driver is already on booking ${dc}.`; }
  await tx.update(schema.bookings).set({
    customerId, vehicleId, driverId, locationId: int(fd.get('locationId')) || null, bookingType: str(fd.get('bookingType')), durationType,
    shift: durationType === '12H' ? str(fd.get('shift')) : null, startAt: start, endAt: end, fuelOut: str(fd.get('fuelOut')), meterOut: int(fd.get('meterOut')) || null,
    rentAmount: rent, driverAmount, totalAmount: total, overrideReason: overrideReason ?? b.overrideReason, notes: str(fd.get('notes')),
    guarantorName: str(fd.get('guarantorName')), guarantorPhone: str(fd.get('guarantorPhone')), guarantorCnic: str(fd.get('guarantorCnic')),
    guarantorAddress: str(fd.get('guarantorAddress')), ...(guarantorCnicId ? { guarantorCnicId } : {}),
  }).where(eq(schema.bookings.id, id));
  return null;
  });
  if (clashMsg) fail(back, clashMsg);
  await log('update', 'booking', id, total !== b.totalAmount ? `total ${b.totalAmount} → ${total}${overrideReason ? ` (${overrideReason.slice(0, 200)})` : ''}` : undefined);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/bookings/${id}`);
}

const FLOW: Record<string, string[]> = { confirm: ['PENDING'], start: ['PENDING', 'CONFIRMED'], cancel: ['PENDING', 'CONFIRMED'] };

export async function changeStatus(fd: FormData) {
  await requirePerm('bookings', 'edit');
  const id = String(fd.get('id')); const op = String(fd.get('op'));
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
  if (!b || !FLOW[op]?.includes(b.status)) fail(`/admin/bookings/${id}`, 'That change is not allowed for this booking.');
  if (op === 'confirm') await db.update(schema.bookings).set({ status: 'CONFIRMED' }).where(eq(schema.bookings.id, id));
  if (op === 'cancel') await db.update(schema.bookings).set({ status: 'CANCELLED', notes: [b.notes, str(fd.get('reason')) && `Cancelled: ${fd.get('reason')}`].filter(Boolean).join('\n') }).where(eq(schema.bookings.id, id));
  if (op === 'start') {
    const [car] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, b.vehicleId));
    await db.update(schema.bookings).set({ status: 'IN_PROGRESS', meterOut: int(fd.get('meterOut')) || b.meterOut || car?.meterReading, fuelOut: str(fd.get('fuelOut')) ?? b.fuelOut }).where(eq(schema.bookings.id, id));
  }
  await log(op, 'booking', id);
  revalidatePath('/admin', 'layout');
  redirect(safeBack(fd.get('back'), `/admin/bookings/${id}`));
}

/** Record a payment against a booking (rent/fine) or a damage report */
export async function addPayment(fd: FormData) {
  const user = await requirePerm('payments', 'create');
  const bookingId = str(fd.get('bookingId'));
  const damageId = str(fd.get('damageId'));
  const back = safeBack(fd.get('back'), '/admin/payments');
  const amount = money(fd.get('amount'));
  if (amount <= 0) fail(back, 'Enter an amount greater than zero.');
  if (!bookingId && !damageId) fail(back, 'Choose a booking or damage report.');
  let customerId: string | null = null;
  let type = oneOf(fd.get('type'), ['ADVANCE', 'RENT', 'FINE'] as const, 'RENT') as string;
  if (damageId) {
    const [d] = await db.select().from(schema.damages).where(eq(schema.damages.id, damageId));
    if (!d) fail(back, 'Damage report not found.');
    customerId = d.customerId; type = 'DAMAGE';
    const [{ paid }] = await db.select({ paid: sql<number>`coalesce(sum(${schema.payments.amount}), 0)::int` }).from(schema.payments).where(eq(schema.payments.damageId, damageId));
    const owed = Math.max(0, d.estimatedCost - paid);
    if (amount > owed) fail(back, `Amount is more than what is still owed on this damage (PKR ${owed.toLocaleString()}).`);
  } else if (bookingId) {
    const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, bookingId));
    if (!b) fail(back, 'Booking not found.');
    customerId = b.customerId;
    const bal = (await bookingBalances([bookingId])).get(bookingId)!;
    if (amount > bal.pending) fail(back, `Amount is more than the pending balance (PKR ${bal.pending.toLocaleString()}).`);
  }
  const id = newPaymentId();
  await db.insert(schema.payments).values({
    id, bookingId: damageId ? null : bookingId, damageId, customerId, amount, type, method: String(fd.get('method') ?? 'Cash'),
    reference: str(fd.get('reference')), note: str(fd.get('note')), paidAt: parsePk(String(fd.get('paidAt') || '')) ?? new Date(), receivedById: user.id,
  });
  if (damageId) {
    const [d] = await db.select().from(schema.damages).where(eq(schema.damages.id, damageId));
    const paid = (await db.select({ a: schema.payments.amount }).from(schema.payments).where(eq(schema.payments.damageId, damageId))).reduce((s, r) => s + r.a, 0);
    if (paid >= d.estimatedCost) await db.update(schema.damages).set({ status: 'PAID' }).where(eq(schema.damages.id, damageId));
  }
  await log('payment', damageId ? 'damage' : 'booking', damageId ?? bookingId, `PKR ${amount}`);
  revalidatePath('/admin', 'layout');
  redirect(fd.get('print') ? `/admin/payments/receipt/${id}?auto=1` : back);
}

export async function deletePayment(fd: FormData) {
  await requirePerm('payments', 'delete');
  const id = String(fd.get('id'));
  const [p] = await db.select().from(schema.payments).where(eq(schema.payments.id, id));
  await db.delete(schema.payments).where(eq(schema.payments.id, id));
  if (p?.damageId) await db.update(schema.damages).set({ status: 'PENDING' }).where(and(eq(schema.damages.id, p.damageId), eq(schema.damages.status, 'PAID')));
  await log('delete', 'payment', id, p ? `PKR ${p.amount}` : undefined);
  revalidatePath('/admin', 'layout');
  redirect(safeBack(fd.get('back'), '/admin/payments'));
}
