'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { int, pkDay, str, isoDay, money } from '@/lib/format';
import { newMaintenanceId } from '@/lib/ids';

export async function saveMaintenance(fd: FormData) {
  const id = str(fd.get('id'));
  await requirePerm('maintenance', id ? 'edit' : 'create');
  const vehicleId = int(fd.get('vehicleId'));
  const types = fd.getAll('types').map(String).filter(Boolean);
  const extra = str(fd.get('newType'));
  if (extra) { types.push(extra); await db.insert(schema.lookups).values({ kind: 'MAINT_TYPE', name: extra }).onConflictDoNothing(); }
  const date = isoDay(fd.get('date'), pkDay());
  if (!vehicleId || !types.length) redirect(`/admin/maintenance?${id ? `edit=${id}` : 'new=1'}&err=${encodeURIComponent('Choose a vehicle and at least one maintenance type.')}`);
  const data = { vehicleId, types, date, cost: money(fd.get('cost')), meterReading: int(fd.get('meterReading')) || null, nextOilChangeKm: int(fd.get('nextOilChangeKm')) || null, notes: str(fd.get('notes')) };
  if (id) await db.update(schema.maintenance).set(data).where(eq(schema.maintenance.id, id));
  else {
    const status = fd.get('sendNow') ? 'IN_PROGRESS' : 'SCHEDULED';
    await db.insert(schema.maintenance).values({ id: newMaintenanceId(), ...data, status });
  }
  if (data.meterReading) {
    const [v] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId));
    if (v && data.meterReading > v.meterReading) await db.update(schema.vehicles).set({ meterReading: data.meterReading }).where(eq(schema.vehicles.id, vehicleId));
  }
  await log(id ? 'update' : 'create', 'maintenance', id ?? vehicleId);
  revalidatePath('/admin', 'layout');
  redirect('/admin/maintenance');
}

export async function setMaintenanceStatus(fd: FormData) {
  await requirePerm('maintenance', 'edit');
  const id = String(fd.get('id')); const status = String(fd.get('status'));
  if (!['IN_PROGRESS', 'COMPLETED', 'SCHEDULED'].includes(status)) return;
  const cost = fd.get('cost') != null ? int(fd.get('cost')) : undefined;
  await db.update(schema.maintenance).set({ status, completedAt: status === 'COMPLETED' ? new Date() : null, ...(cost !== undefined && cost > 0 ? { cost } : {}) }).where(eq(schema.maintenance.id, id));
  await log(status === 'COMPLETED' ? 'complete' : 'send to workshop', 'maintenance', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/maintenance');
}

export async function deleteMaintenance(fd: FormData) {
  await requirePerm('maintenance', 'delete');
  const id = String(fd.get('id'));
  await db.delete(schema.maintenance).where(eq(schema.maintenance.id, id));
  await log('delete', 'maintenance', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/maintenance');
}
