'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { saveUpload } from '@/lib/files';
import { int, str } from '@/lib/format';
import { oneOf, safeBack } from '@/lib/security';

export async function saveCar(fd: FormData) {
  const id = int(fd.get('id'));
  await requirePerm('cars', id ? 'edit' : 'create');
  const regNo = String(fd.get('regNo') ?? '').trim().toUpperCase();
  const data = {
    model: String(fd.get('model') ?? '').trim(), chassisNo: str(fd.get('chassisNo')), regNo, color: str(fd.get('color')),
    category: String(fd.get('category') ?? 'Sedan'), rateDay: int(fd.get('rateDay')), rate12h: int(fd.get('rate12h')),
    meterReading: int(fd.get('meterReading')), investorId: int(fd.get('investorId')) || null,
  };
  if (!data.model || !regNo || !data.rateDay || !data.rate12h) redirect(`/admin/cars?${id ? `edit=${id}` : 'new=1'}&err=${encodeURIComponent('Model, registration number and both prices are required.')}`);
  const [dup] = await db.select({ id: schema.vehicles.id }).from(schema.vehicles).where(eq(schema.vehicles.regNo, regNo));
  if (dup && dup.id !== id) redirect(`/admin/cars?${id ? `edit=${id}` : 'new=1'}&err=${encodeURIComponent(`Registration number ${regNo} already exists.`)}`);
  const photoId = await saveUpload(fd.get('photo'));
  const cardPhotoId = await saveUpload(fd.get('cardPhoto'));
  if (id) {
    await db.update(schema.vehicles).set({ ...data, ...(photoId ? { photoId } : {}), ...(cardPhotoId ? { cardPhotoId } : {}) }).where(eq(schema.vehicles.id, id));
    await log('update', 'vehicle', id, regNo);
  } else {
    const [v] = await db.insert(schema.vehicles).values({ ...data, photoId, cardPhotoId }).returning();
    await log('create', 'vehicle', v.id, regNo);
  }
  revalidatePath('/admin/cars');
  redirect('/admin/cars');
}

export async function deleteCar(fd: FormData) {
  await requirePerm('cars', 'delete');
  const id = int(fd.get('id'));
  const [open] = await db.select({ id: schema.bookings.id }).from(schema.bookings)
    .where(and(eq(schema.bookings.vehicleId, id), inArray(schema.bookings.status, ['PENDING', 'CONFIRMED', 'IN_PROGRESS'])));
  if (open) redirect(`/admin/cars?err=${encodeURIComponent(`This car has an active booking (${open.id}). Finish or cancel it first.`)}`);
  const [any] = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.vehicleId, id));
  // Cars with booking history are deactivated (kept for reports); never-used cars are deleted.
  if (any) await db.update(schema.vehicles).set({ active: false }).where(eq(schema.vehicles.id, id));
  else await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));
  await log(any ? 'deactivate' : 'delete', 'vehicle', id);
  revalidatePath('/admin/cars');
  redirect('/admin/cars');
}

export async function restoreCar(fd: FormData) {
  await requirePerm('cars', 'edit');
  await db.update(schema.vehicles).set({ active: true }).where(eq(schema.vehicles.id, int(fd.get('id'))));
  revalidatePath('/admin/cars');
  redirect('/admin/cars?show=inactive');
}

export async function addLookup(fd: FormData) {
  await requirePerm('cars', 'create');
  const kind = oneOf(fd.get('kind'), ['CAR_CATEGORY', 'MAINT_TYPE', 'DAMAGE_TYPE', 'EXPENSE_CATEGORY', 'BOOKING_TYPE'] as const, 'CAR_CATEGORY');
  const name = String(fd.get('name') ?? '').trim().slice(0, 60);
  if (name) await db.insert(schema.lookups).values({ kind, name }).onConflictDoNothing();
  revalidatePath('/admin', 'layout');
  redirect(safeBack(fd.get('back'), '/admin'));
}
