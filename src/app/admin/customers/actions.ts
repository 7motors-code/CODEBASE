'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { saveUpload } from '@/lib/files';
import { int, str, money } from '@/lib/format';
import { newCustomerId } from '@/lib/ids';

export async function saveCustomer(fd: FormData) {
  const id = str(fd.get('id'));
  await requirePerm('customers', id ? 'edit' : 'create');
  const phone = String(fd.get('phone') ?? '').replace(/\s/g, '');
  const name = String(fd.get('name') ?? '').trim();
  if (!name || !phone) redirect(`/admin/customers?${id ? `edit=${id}` : 'new=1'}&err=Name+and+phone+are+required`);
  const [dup] = await db.select({ id: schema.customers.id }).from(schema.customers).where(eq(schema.customers.phone, phone));
  if (dup && dup.id !== id) redirect(`/admin/customers?${id ? `edit=${id}` : 'new=1'}&err=${encodeURIComponent(`Phone ${phone} already belongs to customer ${dup.id}.`)}`);
  const cnicFrontId = await saveUpload(fd.get('cnicFront'));
  const cnicBackId = await saveUpload(fd.get('cnicBack'));
  const data = { name, phone, email: str(fd.get('email')), cnic: str(fd.get('cnic')), address: str(fd.get('address')), isCredit: fd.get('isCredit') === '1', creditLimit: money(fd.get('creditLimit')) };
  let cid = id;
  if (id) await db.update(schema.customers).set({ ...data, ...(cnicFrontId ? { cnicFrontId } : {}), ...(cnicBackId ? { cnicBackId } : {}) }).where(eq(schema.customers.id, id));
  else { cid = newCustomerId(); await db.insert(schema.customers).values({ id: cid, ...data, cnicFrontId, cnicBackId }); }
  await log(id ? 'update' : 'create', 'customer', cid, name);
  revalidatePath('/admin/customers');
  redirect(`/admin/customers?id=${cid}`);
}

export async function setBlocked(fd: FormData) {
  await requirePerm('customers', 'edit');
  const id = String(fd.get('id'));
  const block = fd.get('block') === '1';
  await db.update(schema.customers).set({ status: block ? 'BLOCKED' : 'ACTIVE', blockReason: block ? str(fd.get('reason')) : null }).where(eq(schema.customers.id, id));
  await log(block ? 'block' : 'unblock', 'customer', id);
  revalidatePath('/admin/customers');
  redirect(`/admin/customers?id=${id}`);
}

export async function deleteCustomer(fd: FormData) {
  await requirePerm('customers', 'delete');
  const id = String(fd.get('id'));
  const [b] = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.customerId, id));
  if (b) redirect(`/admin/customers?id=${id}&err=${encodeURIComponent('This customer has bookings and cannot be deleted. Block them instead.')}`);
  await db.delete(schema.customers).where(eq(schema.customers.id, id));
  await log('delete', 'customer', id);
  revalidatePath('/admin/customers');
  redirect('/admin/customers');
}
