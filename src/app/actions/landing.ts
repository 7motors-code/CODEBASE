'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { log } from '@/lib/auth';
import { rentFor, vehicleClash, withBookingLock } from '@/lib/calc';
import { parsePk, str, int } from '@/lib/format';
import { newBookingId, newCustomerId } from '@/lib/ids';
import { clientIp, hitRateLimit, isRateLimited } from '@/lib/security';

const cnicNorm = (s: string) => s.replace(/\D/g, '');
const clip = (v: FormDataEntryValue | null, n: number) => {
  const s = str(v);
  return s ? s.slice(0, n) : null;
};
const MAX_DAYS = 90;

export interface InquiryResult {
  ok: boolean;
  error?: string;
  bookingId?: string;
  vehicleModel?: string;
  rentEstimate?: number;
  phone?: string;
  whatsappUrl?: string;
}

/**
 * Handle direct booking queries from the landing page.
 * Inserts the lead immediately into the system database as a PENDING booking,
 * prevents double-booking via advisory lock, and notifies admin views.
 */
export async function submitLandingBooking(fd: FormData): Promise<InquiryResult> {
  const vehicleId = int(fd.get('vehicleId'));
  const startRaw = String(fd.get('start') ?? '');
  const endRaw = String(fd.get('end') ?? '');
  const name = String(fd.get('name') ?? '').trim().slice(0, 100);
  const phone = String(fd.get('phone') ?? '').replace(/[\s-]/g, '').slice(0, 20);
  const cnic = String(fd.get('cnic') ?? '').trim().slice(0, 20);
  const durationType = fd.get('durationType') === '12H' ? '12H' : 'DAY';
  const bookingType = fd.get('bookingType') === 'With driver' ? 'With driver' : 'Self-drive';
  const pickupCity = String(fd.get('city') ?? 'Islamabad').trim();
  const notes = clip(fd.get('notes'), 1000);

  if (!vehicleId) return { ok: false, error: 'Please select a vehicle.' };
  if (!name) return { ok: false, error: 'Full name is required.' };
  if (!phone || !/^\+?\d{10,15}$/.test(phone)) return { ok: false, error: 'Valid phone number is required (e.g. 03001234567).' };
  if (cnicNorm(cnic).length !== 13) return { ok: false, error: 'Valid 13-digit CNIC is required (e.g. 35202-1234567-1).' };

  const start = parsePk(startRaw);
  const end = parsePk(endRaw);
  if (!start || !end || end <= start || start.getTime() < Date.now() - 3600000) {
    return { ok: false, error: 'Please choose valid future pickup and return dates.' };
  }
  if (end.getTime() - start.getTime() > MAX_DAYS * 86400000) {
    return { ok: false, error: `Online requests can be up to ${MAX_DAYS} days. Please contact our 24/7 concierge for longer rentals.` };
  }

  // Anti-spam rate limiting
  const ipKey = `landing:book:ip:${clientIp()}`;
  const phoneKey = `landing:book:phone:${phone}`;
  if ((await isRateLimited(ipKey, 10, 60)) || (await isRateLimited(phoneKey, 5, 60))) {
    return { ok: false, error: 'Too many requests submitted from this device. Please call our 24/7 hotline directly.' };
  }

  // Fetch target vehicle
  const [car] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId));
  if (!car || !car.active) {
    return { ok: false, error: 'This vehicle is currently unavailable. Please select another model.' };
  }

  let [cust] = await db.select().from(schema.customers).where(eq(schema.customers.phone, phone));
  if (cust?.status === 'BLOCKED') {
    return { ok: false, error: 'Please contact the office directly regarding this request.' };
  }

  await hitRateLimit(ipKey);
  await hitRateLimit(phoneKey);

  const bookingId = newBookingId();
  const rent = rentFor(car, durationType, start, end).rent;

  // Advisory lock to eliminate double-booking race conditions
  const clash = await withBookingLock(async (tx) => {
    const isClashing = await vehicleClash(vehicleId, start, end, undefined, tx);
    if (isClashing) return isClashing;

    if (!cust) {
      [cust] = await tx
        .insert(schema.customers)
        .values({
          id: newCustomerId(),
          name,
          phone,
          cnic,
          address: pickupCity ? `Pickup City: ${pickupCity}` : null,
        })
        .returning();
    }

    await tx.insert(schema.bookings).values({
      id: bookingId,
      customerId: cust.id,
      vehicleId,
      durationType,
      startAt: start,
      endAt: end,
      rentAmount: rent,
      totalAmount: rent,
      status: 'PENDING',
      source: 'PORTAL',
      bookingType,
      notes: notes ? `[Landing Query] ${notes} (City: ${pickupCity})` : `[Landing Query] City: ${pickupCity}`,
    });

    return null;
  });

  if (clash) {
    return { ok: false, error: 'Sorry, this car is already reserved for the selected dates. Please adjust dates or choose an alternate vehicle.' };
  }

  await log('request', 'booking', bookingId, `landing inquiry from ${name} (${phone})`);
  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/bookings', 'page');

  // WhatsApp quick direct confirmation URL
  const waMessage = encodeURIComponent(
    `Hello Seven Motors, I just submitted an inquiry for ${car.model} (Booking ID: ${bookingId}). Please confirm my rental.`
  );
  const whatsappUrl = `https://wa.me/923000000000?text=${waMessage}`;

  return {
    ok: true,
    bookingId,
    vehicleModel: car.model,
    rentEstimate: rent,
    phone,
    whatsappUrl,
  };
}

/**
 * Handle custom inquiry or event quote queries (weddings, corporate convoys, protocol).
 */
export async function submitGeneralInquiry(fd: FormData): Promise<{ ok: boolean; message?: string; error?: string }> {
  const name = String(fd.get('name') ?? '').trim().slice(0, 100);
  const phone = String(fd.get('phone') ?? '').replace(/[\s-]/g, '').slice(0, 20);
  const serviceType = String(fd.get('serviceType') ?? 'General Inquiry').trim();
  const message = String(fd.get('message') ?? '').trim().slice(0, 1000);

  if (!name || !phone) return { ok: false, error: 'Please provide your name and phone number.' };

  const ipKey = `landing:contact:ip:${clientIp()}`;
  if (await isRateLimited(ipKey, 10, 60)) {
    return { ok: false, error: 'Too many messages sent. Please contact us via phone or WhatsApp.' };
  }

  await hitRateLimit(ipKey);

  // Record in devRequests / customer leads
  await db.insert(schema.devRequests).values({
    title: `[Customer Lead] ${serviceType} from ${name}`,
    description: `Phone: ${phone}\nRequirement: ${message || 'No additional details.'}`,
    priority: 'HIGH',
    status: 'OPEN',
    createdByName: `${name} (Landing Page)`,
  });

  await log('create', 'lead', phone, `customer lead from ${name}`);
  revalidatePath('/admin', 'layout');

  return { ok: true, message: 'Thank you! Our fleet manager will contact you within 15 minutes.' };
}
