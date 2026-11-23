'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray, notInArray } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm, log } from '@/lib/auth';
import { investorSummary } from '@/lib/calc';
import { PAY_METHODS, int, isoMonth, monthLabel, pkDay, str } from '@/lib/format';
import { oneOf } from '@/lib/security';
import { newExpenseId } from '@/lib/ids';

export async function saveInvestor(fd: FormData) {
  const id = int(fd.get('id'));
  await requirePerm('investors', id ? 'edit' : 'create');
  const name = String(fd.get('name') ?? '').trim();
  if (!name) redirect(`/admin/investors?${id ? `edit=${id}` : 'new=1'}&err=Name+is+required`);
  const rawPct = Number(fd.get('sharePercent') || 50);
  const pct = Number.isFinite(rawPct) ? Math.min(100, Math.max(0, rawPct)) : 50;
  const data = { name, phone: str(fd.get('phone')), cnic: str(fd.get('cnic')), address: str(fd.get('address')), bankDetails: str(fd.get('bankDetails')), sharePercent: String(pct) };
  let iid = id;
  if (id) await db.update(schema.investors).set(data).where(eq(schema.investors.id, id));
  else iid = (await db.insert(schema.investors).values(data).returning())[0].id;
  const cars = fd.getAll('vehicleIds').map((v) => int(v)).filter(Boolean);
  // unassign cars removed from this investor, assign the selected ones
  if (cars.length) {
    await db.update(schema.vehicles).set({ investorId: null }).where(and(eq(schema.vehicles.investorId, iid), notInArray(schema.vehicles.id, cars)));
    await db.update(schema.vehicles).set({ investorId: iid }).where(inArray(schema.vehicles.id, cars));
  } else {
    await db.update(schema.vehicles).set({ investorId: null }).where(eq(schema.vehicles.investorId, iid));
  }
  await log(id ? 'update' : 'create', 'investor', iid, name);
  revalidatePath('/admin', 'layout');
  redirect('/admin/investors');
}

export async function markPaid(fd: FormData) {
  await requirePerm('investors', 'edit');
  const investorId = int(fd.get('investorId'));
  const month = isoMonth(fd.get('month'));
  if (!month) redirect(`/admin/investors?view=${investorId}`);
  const s = await investorSummary(investorId, month);
  if (!s) redirect('/admin/investors');
  if (s.payout) redirect(`/admin/investors?view=${investorId}&month=${month}`);
  const expenseId = s.payable > 0 ? newExpenseId() : null;
  const method = oneOf(fd.get('method'), PAY_METHODS, 'Bank transfer');
  // Payout row first: its unique index stops a double submit before any expense is booked.
  await db.transaction(async (tx) => {
    const [row] = await tx.insert(schema.investorPayouts)
      .values({ investorId, month, revenue: s.revenue, share: s.share, maintenance: s.maintenance, payable: s.payable, paidAt: new Date(), expenseId })
      .onConflictDoNothing().returning({ id: schema.investorPayouts.id });
    if (row && expenseId) await tx.insert(schema.expenses).values({ id: expenseId, date: pkDay(), category: 'Investor payout', description: `Investor payout: ${s.investor.name} — ${monthLabel(month)}`, amount: s.payable, method, source: 'INVESTOR' });
  });
  await log('payout', 'investor', investorId, `${month} PKR ${s.payable}`);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/investors?view=${investorId}&month=${month}`);
}

export async function deleteInvestor(fd: FormData) {
  await requirePerm('investors', 'delete');
  const id = int(fd.get('id'));
  await db.update(schema.vehicles).set({ investorId: null }).where(eq(schema.vehicles.investorId, id));
  await db.delete(schema.investors).where(eq(schema.investors.id, id));
  await log('delete', 'investor', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/investors');
}
