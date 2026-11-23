'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, count, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { log } from '@/lib/auth';
import { rentFor, vehicleClash, withBookingLock } from '@/lib/calc';
import { parsePk, str, int } from '@/lib/format';
import { newBookingId, newCustomerId } from '@/lib/ids';
import { sign, PORTAL_COOKIE, cookieOpts } from '@/lib/session';
import { clearRateLimit, clientIp, hitRateLimit, isRateLimited } from '@/lib/security';

const cnicNorm = (s: string) => s.replace(/\D/g, '');
const clip = (v: FormDataEntryValue | null, n: number) => { const s = str(v); return s ? s.slice(0, n) : null; };
const MAX_DAYS = 90;
/** Portal sessions last a week; shorter than before so a stolen cookie expires sooner. */
const PORTAL_DAYS = 7;
/** Pakistani mobile numbers: 03XXXXXXXXX, 923XXXXXXXXX or +923XXXXXXXXX. */
const PK_MOBILE = /^(?:\+?92|0)3\d{9}$/;
/** Open online requests one customer may have at a time (stops a single account locking the fleet). */
const MAX_OPEN_REQUESTS = 2;
/** New customer records one IP may create online per day. */
const MAX_NEW_CUSTOMERS_PER_IP_DAY = 3;
/** One wording for every identity problem, so the form cannot be used to test phone/CNIC pairs. */
const IDENTITY_ERROR = 'We could not process this request online. Please call the office.';

export type PortalFormState = { error: string | null; at: number };
const failState = (error: string): PortalFormState => ({ error, at: Date.now() });

/** Phone/CNIC failures from the booking form and the login form share one counter per phone. */
const identityKey = (phone: string) => `portal:login:phone:${phone}`;

export async function requestBooking(_prev: PortalFormState, fd: FormData): Promise<PortalFormState> {
  const vehicleId = int(fd.get('vehicleId'));
  const name = String(fd.get('name') ?? '').trim().slice(0, 100);
  const phone = String(fd.get('phone') ?? '').replace(/[\s-]/g, '').slice(0, 20);
  const cnic = String(fd.get('cnic') ?? '').trim().slice(0, 20);
  const start = parsePk(String(fd.get('start') ?? '')), end = parsePk(String(fd.get('end') ?? ''));
  const durationType = fd.get('durationType') === '12H' ? '12H' : 'DAY';
  if (!name) return failState('Please enter your full name.');
  if (!PK_MOBILE.test(phone)) return failState('Please enter a Pakistani mobile number, for example 03001234567.');
  if (cnicNorm(cnic).length !== 13) return failState('Please enter your 13-digit CNIC.');
  if (!start || !end || end <= start || start.getTime() < Date.now() - 3600000) return failState('Please choose a return time after the pick-up time, both in the future.');
  if (end.getTime() - start.getTime() > MAX_DAYS * 86400000) return failState(`Online requests can be up to ${MAX_DAYS} days. Please call the office for longer rentals.`);

  // Every attempt counts toward the limits, including ones that fail below; otherwise wrong
  // CNIC guesses would never be counted.
  const ip = clientIp();
  const ipKey = `portal:req:ip:${ip}`, phoneKey = `portal:req:phone:${phone}`;
  if ((await isRateLimited(ipKey, 10, 60)) || (await isRateLimited(phoneKey, 5, 60)) || (await isRateLimited(identityKey(phone), 5, 15))) {
    return failState('Too many requests. Please try again later or call the office.');
  }
  await hitRateLimit(ipKey, 60); await hitRateLimit(phoneKey, 60);

  const [car] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId));
  if (!car || !car.active) return failState('This car is no longer available. Please pick another one.');

  const [existing] = await db.select().from(schema.customers).where(eq(schema.customers.phone, phone));
  if (existing && (existing.status === 'BLOCKED' || !existing.cnic || cnicNorm(existing.cnic) !== cnicNorm(cnic))) {
    await hitRateLimit(identityKey(phone));
    return failState(IDENTITY_ERROR);
  }
  if (existing) {
    const [open] = await db.select({ n: count() }).from(schema.bookings).where(and(
      eq(schema.bookings.customerId, existing.id), eq(schema.bookings.status, 'PENDING'), eq(schema.bookings.source, 'PORTAL')));
    if (Number(open.n) >= MAX_OPEN_REQUESTS) return failState('You already have requests waiting for the office. Please wait for their call, or call the office.');
  } else {
    const newKey = `portal:newcust:ip:${ip}`;
    if (await isRateLimited(newKey, MAX_NEW_CUSTOMERS_PER_IP_DAY, 1440)) return failState('Too many new requests from this connection today. Please call the office.');
    await hitRateLimit(newKey, 1440);
  }

  const id = newBookingId();
  const outcome = await withBookingLock(async (tx) => {
    const c = await vehicleClash(vehicleId, start, end, undefined, tx);
    if (c) return { clash: true as const };
    // Re-read inside the lock so two parallel requests cannot both create the same customer.
    let [cust] = await tx.select().from(schema.customers).where(eq(schema.customers.phone, phone));
    const created = !cust;
    if (created) [cust] = await tx.insert(schema.customers).values({ id: newCustomerId(), name, phone, cnic, address: clip(fd.get('address'), 300) }).returning();
    const rent = rentFor(car, durationType, start, end).rent;
    const note = clip(fd.get('notes'), 1000);
    await tx.insert(schema.bookings).values({
      id, customerId: cust.id, vehicleId, durationType, startAt: start, endAt: end, rentAmount: rent, totalAmount: rent, status: 'PENDING', source: 'PORTAL', bookingType: 'Self-drive',
      // Phone and CNIC were typed online and are not verified yet.
      notes: [created ? 'New customer from the online form: check the original CNIC at pickup.' : null, note].filter(Boolean).join('\n') || null,
    });
    return { clash: false as const, customerId: cust.id, customerName: cust.name, created };
  });
  if (outcome.clash) return failState('Sorry, this car is already booked for those dates. Please pick other dates or another car.');
  await log('request', 'booking', id, 'customer portal');
  // Only a brand-new customer is signed in straight away. An existing customer signs in with
  // phone + CNIC as usual, so the booking form never works as a way into someone's account.
  if (outcome.created) cookies().set(PORTAL_COOKIE, await sign({ customerId: outcome.customerId, name: outcome.customerName, kind: 'portal' }, PORTAL_DAYS), cookieOpts(PORTAL_DAYS));
  revalidatePath('/admin', 'layout');
  redirect(`/portal/my?requested=${id}`);
}

export type LoginState = { error: string | null; phone: string; at: number };

export async function portalLogin(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const phone = String(fd.get('phone') ?? '').replace(/[\s-]/g, '').slice(0, 20);
  const cnic = cnicNorm(String(fd.get('cnic') ?? ''));
  const ipKey = `portal:login:ip:${clientIp()}`, phoneKey = identityKey(phone);
  if ((await isRateLimited(ipKey, 15, 15)) || (await isRateLimited(phoneKey, 5, 15))) {
    return { error: 'Too many attempts. Please wait 15 minutes and try again.', phone, at: Date.now() };
  }
  const [c] = phone ? await db.select().from(schema.customers).where(eq(schema.customers.phone, phone)) : [];
  if (!c || !c.cnic || cnicNorm(c.cnic) !== cnic || c.status === 'BLOCKED') {
    await hitRateLimit(ipKey); await hitRateLimit(phoneKey);
    return { error: 'Phone and CNIC did not match our records.', phone, at: Date.now() };
  }
  await clearRateLimit(phoneKey);
  cookies().set(PORTAL_COOKIE, await sign({ customerId: c.id, name: c.name, kind: 'portal' }, PORTAL_DAYS), cookieOpts(PORTAL_DAYS));
  redirect('/portal/my');
}

export async function portalLogout() {
  cookies().delete(PORTAL_COOKIE);
  redirect('/portal');
}
