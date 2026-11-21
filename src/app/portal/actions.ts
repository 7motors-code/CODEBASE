'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
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

export async function requestBooking(fd: FormData) {
  const vehicleId = int(fd.get('vehicleId'));
  const startRaw = String(fd.get('start') ?? ''), endRaw = String(fd.get('end') ?? '');
  const back = `/portal?car=${vehicleId}&start=${encodeURIComponent(startRaw)}&end=${encodeURIComponent(endRaw)}`;
  const fail = (msg: string): never => redirect(`${back}&err=${encodeURIComponent(msg)}`);
  const name = String(fd.get('name') ?? '').trim().slice(0, 100);
  const phone = String(fd.get('phone') ?? '').replace(/[\s-]/g, '').slice(0, 20);
  const cnic = String(fd.get('cnic') ?? '').trim().slice(0, 20);
  const start = parsePk(startRaw), end = parsePk(endRaw);
  const durationType = fd.get('durationType') === '12H' ? '12H' : 'DAY';
  if (!name || !/^\+?\d{10,15}$/.test(phone) || cnicNorm(cnic).length !== 13) fail('Please enter your name, phone and 13-digit CNIC.');
  if (!start || !end || end <= start || start.getTime() < Date.now() - 3600000) fail('Please choose valid future dates.');
  if (end!.getTime() - start!.getTime() > MAX_DAYS * 86400000) fail(`Online requests can be up to ${MAX_DAYS} days. Please call the office for longer rentals.`);

  // Anti-spam: limit booking requests per IP and per phone
  const ipKey = `portal:req:ip:${clientIp()}`, phoneKey = `portal:req:phone:${phone}`;
  if ((await isRateLimited(ipKey, 10, 60)) || (await isRateLimited(phoneKey, 5, 60))) fail('Too many requests. Please try again later or call the office.');

  const [car] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId));
  if (!car || !car.active) redirect('/portal');

  let [cust] = await db.select().from(schema.customers).where(eq(schema.customers.phone, phone));
  if (cust?.status === 'BLOCKED') fail('Please contact the office to book.');
  // Security: someone who only knows a phone number must not get into that customer's account.
  if (cust && (!cust.cnic || cnicNorm(cust.cnic) !== cnicNorm(cnic))) fail('This phone number is registered with a different CNIC. Please call the office.');

  await hitRateLimit(ipKey); await hitRateLimit(phoneKey);
  const id = newBookingId();
  const clash = await withBookingLock(async (tx) => {
    const c = await vehicleClash(vehicleId, start!, end!, undefined, tx);
    if (c) return c;
    if (!cust) [cust] = await tx.insert(schema.customers).values({ id: newCustomerId(), name, phone, cnic, address: clip(fd.get('address'), 300) }).returning();
    const rent = rentFor(car, durationType, start!, end!).rent;
    await tx.insert(schema.bookings).values({ id, customerId: cust.id, vehicleId, durationType, startAt: start!, endAt: end!, rentAmount: rent, totalAmount: rent, status: 'PENDING', source: 'PORTAL', bookingType: 'Self-drive', notes: clip(fd.get('notes'), 1000) });
    return null;
  });
  if (clash) fail('Sorry, this car is already booked for those dates.');
  await log('request', 'booking', id, 'customer portal');
  cookies().set(PORTAL_COOKIE, await sign({ customerId: cust.id, name: cust.name, kind: 'portal' }, 30), cookieOpts(30));
  revalidatePath('/admin', 'layout');
  redirect(`/portal/my?requested=${id}`);
}

export async function portalLogin(fd: FormData) {
  const phone = String(fd.get('phone') ?? '').replace(/[\s-]/g, '').slice(0, 20);
  const cnic = cnicNorm(String(fd.get('cnic') ?? ''));
  const ipKey = `portal:login:ip:${clientIp()}`, phoneKey = `portal:login:phone:${phone}`;
  if ((await isRateLimited(ipKey, 15, 15)) || (await isRateLimited(phoneKey, 5, 15))) redirect('/portal/my?err=locked');
  const [c] = phone ? await db.select().from(schema.customers).where(eq(schema.customers.phone, phone)) : [];
  if (!c || !c.cnic || cnicNorm(c.cnic) !== cnic || c.status === 'BLOCKED') {
    await hitRateLimit(ipKey); await hitRateLimit(phoneKey);
    redirect('/portal/my?err=1');
  }
  await clearRateLimit(phoneKey);
  cookies().set(PORTAL_COOKIE, await sign({ customerId: c.id, name: c.name, kind: 'portal' }, 30), cookieOpts(30));
  redirect('/portal/my');
}

export async function portalLogout() {
  cookies().delete(PORTAL_COOKIE);
  redirect('/portal');
}
