'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { saveUpload } from '@/lib/files';
import { int, pkDay, str } from '@/lib/format';
import { newExpenseId } from '@/lib/ids';

export async function saveExpense(fd: FormData) {
  const id = str(fd.get('id'));
  await requirePerm('expenses', id ? 'edit' : 'create');
  const amount = int(fd.get('amount'));
  let category = String(fd.get('category') ?? '').trim();
  if (!category || amount <= 0) redirect(`/admin/expenses?${id ? `edit=${id}` : 'new=1'}&err=Category+and+amount+are+required`);
  category = category.charAt(0).toUpperCase() + category.slice(1);
  await db.insert(schema.lookups).values({ kind: 'EXPENSE_CATEGORY', name: category }).onConflictDoNothing();
  const receiptId = await saveUpload(fd.get('receipt'));
  const data = { date: String(fd.get('date') || pkDay()), category, description: str(fd.get('description')), amount, method: String(fd.get('method') ?? 'Cash') };
  if (id) await db.update(schema.expenses).set({ ...data, ...(receiptId ? { receiptId } : {}) }).where(eq(schema.expenses.id, id));
  else await db.insert(schema.expenses).values({ id: newExpenseId(), ...data, receiptId });
  await log(id ? 'update' : 'create', 'expense', id ?? category, `PKR ${amount}`);
  revalidatePath('/admin', 'layout');
  redirect('/admin/expenses');
}

export async function deleteExpense(fd: FormData) {
  await requirePerm('expenses', 'delete');
  const id = String(fd.get('id'));
  const [e] = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id));
  if (e && e.source !== 'MANUAL') redirect(`/admin/expenses?err=${encodeURIComponent('This expense was created by a driver or investor payment. Delete it from there.')}`);
  await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
  await log('delete', 'expense', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/expenses');
}
