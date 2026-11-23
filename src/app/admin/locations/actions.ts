'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { int, str } from '@/lib/format';

export async function saveLocation(fd: FormData) {
  const id = int(fd.get('id'));
  await requirePerm('locations', id ? 'edit' : 'create');
  const name = String(fd.get('name') ?? '').trim();
  if (!name) redirect(`/admin/locations?${id ? `edit=${id}` : 'new=1'}&err=Name+is+required`);
  const data = { name, city: str(fd.get('city')), address: str(fd.get('address')), active: fd.get('active') !== '0' };
  if (id) await db.update(schema.locations).set(data).where(eq(schema.locations.id, id));
  else await db.insert(schema.locations).values(data);
  await log(id ? 'update' : 'create', 'location', id || name);
  revalidatePath('/admin', 'layout');
  redirect('/admin/locations');
}
export async function deleteLocation(fd: FormData) {
  await requirePerm('locations', 'delete');
  const id = int(fd.get('id'));
  const [used] = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.locationId, id));
  if (used) await db.update(schema.locations).set({ active: false }).where(eq(schema.locations.id, id));
  else await db.delete(schema.locations).where(eq(schema.locations.id, id));
  await log(used ? 'deactivate' : 'delete', 'location', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/locations');
}
