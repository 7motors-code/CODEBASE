import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm } from '@/lib/auth';
import { bookingBalances, getSetting } from '@/lib/calc';
import { fmtDateTime, pkr } from '@/lib/format';
import { PrintButton } from '@/components/client';

export default async function Receipt({ params, searchParams }: { params: { id: string }; searchParams: { auto?: string } }) {
  await requirePerm('payments');
  const [p] = await db.select().from(schema.payments).where(eq(schema.payments.id, params.id));
  if (!p) notFound();
  const [c] = p.customerId ? await db.select().from(schema.customers).where(eq(schema.customers.id, p.customerId)) : [];
  const [b] = p.bookingId ? await db.select().from(schema.bookings).where(eq(schema.bookings.id, p.bookingId)) : [];
  const [v] = b ? await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, b.vehicleId)) : [];
  const [u] = p.receivedById ? await db.select().from(schema.users).where(eq(schema.users.id, p.receivedById)) : [];
  const bal = b ? (await bookingBalances([b.id])).get(b.id) : null;
  const business = await getSetting('business_name', 'Seven Motors');
  const phone = await getSetting('business_phone', '');
  return (
    <div className="mx-auto max-w-md">
      <div className="no-print mb-4 flex justify-end"><PrintButton label="Print receipt" auto={searchParams.auto === '1'} /></div>
      <div className="print-area rounded-2xl bg-white p-6 text-slate-900 shadow">
        <div className="text-center">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logo.jpg" alt="" className="mx-auto h-16 w-16 rounded-full" /><p className="mt-2 text-lg font-medium text-[#0B2A5B]">{business}</p>{phone && <p className="text-xs">{phone}</p>}<p className="mt-1 text-sm font-medium">PAYMENT RECEIPT</p></div>
        <div className="mt-4 space-y-1 border-y border-dashed border-slate-400 py-3 text-sm">
          {[['Receipt no', p.id], ['Date', fmtDateTime(p.paidAt)], ['Customer', c ? `${c.name} · ${c.phone}` : '—'], ['Booking', p.bookingId ?? '—'], ['Damage report', p.damageId ?? '—'], ['Vehicle', v ? `${v.model} (${v.regNo})` : '—'], ['For', p.type.toLowerCase()], ['Method', p.method], ['Reference', p.reference ?? '—'], ['Received by', u?.name ?? '—']].map(([k, val]) => <div key={k} className="flex justify-between gap-3"><span className="text-slate-500">{k}</span><span className="text-end font-medium">{val}</span></div>)}
        </div>
        <p className="mt-3 flex justify-between text-xl font-medium tabular-nums"><span>Amount</span><span>{pkr(p.amount)}</span></p>
        {bal && <p className="mt-1 flex justify-between text-sm"><span className="text-slate-500">Balance remaining</span><span>{pkr(bal.pending)}</span></p>}
        <p className="mt-6 text-center text-xs text-slate-500">Thank you for choosing {business}.</p>
      </div>
    </div>
  );
}
