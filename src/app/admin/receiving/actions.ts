'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { saveUploads } from '@/lib/files';
import { PAY_METHODS, clipStr, int, money, parsePk } from '@/lib/format';
import { oneOf } from '@/lib/security';
import { newPaymentId } from '@/lib/ids';
import { bookingBalances } from '@/lib/calc';

export async function receiveVehicle(fd: FormData) {
  const user = await requirePerm('receiving', 'create');
  const id = String(fd.get('bookingId'));
  const back = `/admin/receiving?booking=${id}`;
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
  if (!b || b.status !== 'IN_PROGRESS') redirect(`${back}&err=${encodeURIComponent('Only bookings that are In Progress can be received.')}`);
  const receivedAt = parsePk(String(fd.get('receivedAt'))) ?? new Date();
  const meterIn = int(fd.get('meterIn')) || null;
  if (meterIn && b.meterOut && meterIn < b.meterOut) redirect(`${back}&err=${encodeURIComponent(`Meter in (${meterIn}) cannot be less than meter out (${b.meterOut}).`)}`);
  const fine = money(fd.get('fine'));
  // Claim the booking first: a double submit finds it already COMPLETED and stops,
  // so it can never record two receivings (and two fines).
  const claimed = await db.update(schema.bookings).set({ status: 'COMPLETED' })
    .where(and(eq(schema.bookings.id, id), eq(schema.bookings.status, 'IN_PROGRESS'))).returning({ id: schema.bookings.id });
  if (claimed.length === 0) redirect(`${back}&err=${encodeURIComponent('This booking was already received.')}`);
  const photoIds = await saveUploads(fd.getAll('photos'));
  await db.insert(schema.receivings).values({ bookingId: id, receivedAt, meterIn, fuelIn: clipStr(fd.get('fuelIn'), 40), notes: clipStr(fd.get('notes'), 2000), photoIds, fine, fineNote: clipStr(fd.get('fineNote'), 500), receivedById: user.id });
  if (meterIn) await db.update(schema.vehicles).set({ meterReading: meterIn }).where(eq(schema.vehicles.id, b.vehicleId));
  const collect = money(fd.get('collect'));
  if (collect > 0) {
    const bal = (await bookingBalances([id])).get(id)!;
    const payAmount = Math.min(collect, bal?.pending ?? 0);
    if (payAmount > 0) {
      await db.insert(schema.payments).values({ id: newPaymentId(), bookingId: id, customerId: b.customerId, amount: payAmount, type: fine > 0 && payAmount <= fine ? 'FINE' : 'RENT', method: oneOf(fd.get('method'), PAY_METHODS, 'Cash'), paidAt: new Date(), receivedById: user.id });
    }
  }
  await log('receive', 'booking', id, `fine ${fine}`);
  revalidatePath('/admin', 'layout');
  redirect(fd.get('damage') ? `/admin/damage?booking=${id}` : `/admin/receiving?done=${id}`);
}
