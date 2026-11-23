'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { saveUpload } from '@/lib/files';
import { int, pkDay, str, PAY_METHODS, clipStr, isoDay, money } from '@/lib/format';
import { newExpenseId } from '@/lib/ids';
import { oneOf } from '@/lib/security';

/** Remember the month a driver went inactive, so salary stops accruing after it. */
async function markDriverStatusChange(id: number, status: string) {
  const key = `driver_inactive:${id}`;
  if (status === 'INACTIVE') {
    const value = pkDay().slice(0, 7);
    await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  } else {
    await db.delete(schema.settings).where(eq(schema.settings.key, key));
  }
}

export async function saveDriver(fd: FormData) {
  const id = int(fd.get('id'));
  await requirePerm('drivers', id ? 'edit' : 'create');
  const basis = String(fd.get('paymentBasis')) === 'SALARY' ? 'SALARY' : 'PER_BOOKING';
  const data = {
    name: String(fd.get('name') ?? '').trim(), age: int(fd.get('age')) || null, cnic: str(fd.get('cnic')), licenseNo: str(fd.get('licenseNo')),
    licenseExpiry: str(fd.get('licenseExpiry')), phone: str(fd.get('phone')), paymentBasis: basis,
    perDayFee: money(fd.get('perDayFee')), monthlySalary: basis === 'SALARY' ? money(fd.get('monthlySalary')) : 0, status: oneOf(fd.get('status'), ['ACTIVE', 'INACTIVE'] as const, 'ACTIVE'),
  };
  if (!data.name) redirect(`/admin/drivers?${id ? `edit=${id}` : 'new=1'}&err=Name+is+required`);
  const photoId = await saveUpload(fd.get('photo'));
  if (id) {
    const [before] = await db.select({ status: schema.drivers.status }).from(schema.drivers).where(eq(schema.drivers.id, id));
    if (before && before.status !== data.status) await markDriverStatusChange(id, data.status);
  }
  if (id) await db.update(schema.drivers).set({ ...data, ...(photoId ? { photoId } : {}) }).where(eq(schema.drivers.id, id));
  else await db.insert(schema.drivers).values({ ...data, photoId });
  await log(id ? 'update' : 'create', 'driver', id || data.name);
  revalidatePath('/admin', 'layout');
  redirect('/admin/drivers');
}

export async function payDriver(fd: FormData) {
  await requirePerm('drivers', 'edit');
  // Paying a driver books an expense, so it also needs expense rights.
  await requirePerm('expenses', 'create');
  const driverId = int(fd.get('driverId'));
  const amount = money(fd.get('amount'));
  if (amount <= 0) redirect(`/admin/drivers?pay=${driverId}&err=Enter+an+amount`);
  const [d] = await db.select().from(schema.drivers).where(eq(schema.drivers.id, driverId));
  if (!d) redirect('/admin/drivers?err=Driver+not+found');
  const date = isoDay(fd.get('date'), pkDay());
  const method = oneOf(fd.get('method'), PAY_METHODS, 'Cash');
  const note = clipStr(fd.get('note'), 300);
  const expenseId = newExpenseId();
  await db.insert(schema.expenses).values({ id: expenseId, date, category: d.paymentBasis === 'SALARY' ? 'Salaries' : 'Driver pay', description: `Driver payment: ${d.name}${note ? ` — ${note}` : ''}`, amount, method, source: 'DRIVER' });
  await db.insert(schema.driverPayments).values({ driverId, amount, date, method, note, expenseId });
  await log('pay', 'driver', driverId, `PKR ${amount}`);
  revalidatePath('/admin', 'layout');
  redirect('/admin/drivers');
}

export async function deleteDriver(fd: FormData) {
  await requirePerm('drivers', 'delete');
  const id = int(fd.get('id'));
  const [used] = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.driverId, id));
  if (used) { await db.update(schema.drivers).set({ status: 'INACTIVE' }).where(eq(schema.drivers.id, id)); await markDriverStatusChange(id, 'INACTIVE'); }
  else await db.delete(schema.drivers).where(eq(schema.drivers.id, id));
  await log(used ? 'deactivate' : 'delete', 'driver', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/drivers');
}
