'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { saveUploads } from '@/lib/files';
import { int, parsePk, str } from '@/lib/format';
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
  const fine = int(fd.get('fine'));
  const photoIds = await saveUploads(fd.getAll('photos'));
  await db.insert(schema.receivings).values({ bookingId: id, receivedAt, meterIn, fuelIn: str(fd.get('fuelIn')), notes: str(fd.get('notes')), photoIds, fine, fineNote: str(fd.get('fineNote')), receivedById: user.id });
  await db.update(schema.bookings).set({ status: 'COMPLETED' }).where(eq(schema.bookings.id, id));
  if (meterIn) await db.update(schema.vehicles).set({ meterReading: meterIn }).where(eq(schema.vehicles.id, b.vehicleId));
  const collect = int(fd.get('collect'));
  if (collect > 0) {
    const bal = (await bookingBalances([id])).get(id)!;
    await db.insert(schema.payments).values({ id: newPaymentId(), bookingId: id, customerId: b.customerId, amount: Math.min(collect, bal.pending), type: fine > 0 && collect <= fine ? 'FINE' : 'RENT', method: String(fd.get('method') ?? 'Cash'), paidAt: new Date(), receivedById: user.id });
  }
  await log('receive', 'booking', id, `fine ${fine}`);
  revalidatePath('/admin', 'layout');
  redirect(fd.get('damage') ? `/admin/damage?booking=${id}` : `/admin/receiving?done=${id}`);
}
