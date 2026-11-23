'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { saveUploads } from '@/lib/files';
import { clipStr, money, str } from '@/lib/format';
import { newDamageId } from '@/lib/ids';
import { damagePaid } from '@/lib/calc';

export async function saveDamage(fd: FormData) {
  await requirePerm('damage', 'create');
  const bookingId = String(fd.get('bookingId') ?? '');
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, bookingId));
  if (!b) redirect(`/admin/damage?err=${encodeURIComponent('Select a booking first.')}`);
  let damageType = String(fd.get('damageType') ?? '').trim().slice(0, 60);
  if (!damageType) redirect(`/admin/damage?booking=${bookingId}&err=${encodeURIComponent('Enter the damage type.')}`);
  damageType = damageType.charAt(0).toUpperCase() + damageType.slice(1);
  await db.insert(schema.lookups).values({ kind: 'DAMAGE_TYPE', name: damageType }).onConflictDoNothing();
  const mediaIds = await saveUploads(fd.getAll('media'));
  const id = newDamageId();
  await db.insert(schema.damages).values({ id, bookingId, vehicleId: b.vehicleId, customerId: b.customerId, damageType, description: clipStr(fd.get('description'), 2000), mediaIds, estimatedCost: money(fd.get('estimatedCost')) });
  await log('create', 'damage', id, `${damageType} ${fd.get('estimatedCost')}`);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/damage?saved=${id}`);
}

export async function setDamageStatus(fd: FormData) {
  await requirePerm('damage', 'edit');
  const id = String(fd.get('id')); const status = String(fd.get('status'));
  if (!['PENDING', 'PAID', 'WAIVED'].includes(status)) return;
  await db.update(schema.damages).set({ status }).where(eq(schema.damages.id, id));
  await log(status.toLowerCase(), 'damage', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/damage');
}

export async function updateDamage(fd: FormData) {
  await requirePerm('damage', 'edit');
  const id = String(fd.get('id'));
  const [d] = await db.select().from(schema.damages).where(eq(schema.damages.id, id));
  if (!d) redirect('/admin/damage?err=Incident+not+found');
  const more = await saveUploads(fd.getAll('media'));
  const estimatedCost = money(fd.get('estimatedCost'));
  // Re-derive the status from what has been paid, so raising the cost reopens a PAID
  // incident and lowering it to the amount paid settles it. A waived incident stays waived.
  const paid = (await damagePaid([id])).get(id) ?? 0;
  const status = d.status === 'WAIVED' ? 'WAIVED' : paid >= estimatedCost && estimatedCost > 0 ? 'PAID' : 'PENDING';
  await db.update(schema.damages).set({ damageType: String(fd.get('damageType') ?? d.damageType).trim().slice(0, 60) || d.damageType, description: clipStr(fd.get('description'), 2000), estimatedCost, status, mediaIds: [...(d.mediaIds ?? []), ...more] }).where(eq(schema.damages.id, id));
  await log('update', 'damage', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/damage');
}

export async function deleteDamage(fd: FormData) {
  await requirePerm('damage', 'delete');
  const id = String(fd.get('id'));
  // Payments point at the incident; deleting it would leave orphan revenue in the reports.
  if (((await damagePaid([id])).get(id) ?? 0) > 0) redirect(`/admin/damage?err=${encodeURIComponent('This incident has payments recorded. Delete those payments first, or mark it Waived.')}`);
  await db.delete(schema.damages).where(eq(schema.damages.id, id));
  await log('delete', 'damage', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/damage');
}
