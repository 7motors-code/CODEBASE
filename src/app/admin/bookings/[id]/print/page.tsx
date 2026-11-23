import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm } from '@/lib/auth';
import { getSetting, bookingBalances } from '@/lib/calc';
import { fmtDateTime, pkr } from '@/lib/format';
import { PrintButton } from '@/components/client';

export default async function PrintAgreement({ params, searchParams }: { params: { id: string }; searchParams: { auto?: string } }) {
  await requirePerm('bookings');
  const [row] = await db.select({ b: schema.bookings, c: schema.customers, v: schema.vehicles, d: schema.drivers, l: schema.locations })
    .from(schema.bookings).leftJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId))
    .leftJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId)).leftJoin(schema.drivers, eq(schema.drivers.id, schema.bookings.driverId))
    .leftJoin(schema.locations, eq(schema.locations.id, schema.bookings.locationId)).where(eq(schema.bookings.id, params.id));
  if (!row) notFound();
  const { b, c, v, d, l } = row;
  const bal = (await bookingBalances([b.id])).get(b.id)!;
  const business = await getSetting('business_name', 'Seven Motors');
  const phone = await getSetting('business_phone', '');
  const address = await getSetting('business_address', '');
  const terms = (await getSetting('agreement_terms', '')).split('\n').filter(Boolean);
  const F = ({ k, v: val }: { k: string; v: React.ReactNode }) => <div className="border-b border-slate-300 py-1"><span className="text-[11px] text-slate-500">{k}</span><div className="text-sm font-medium">{val || '—'}</div></div>;
  const img = (id: string | null | undefined, label: string) => <div className="text-center text-[11px] text-slate-500">{id ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/files/${id}`} alt={label} className="mx-auto h-24 max-w-[180px] object-contain" /> : <div className="mx-auto h-24 w-40 border border-dashed border-slate-300" />}<p>{label}</p></div>;
  return (
    <div className="mx-auto max-w-[820px]">
      <div className="no-print mb-4 flex justify-end"><PrintButton label="Print rental paper" auto={searchParams.auto === '1'} /></div>
      <div className="print-area rounded-2xl bg-white p-8 text-slate-900 shadow">
        <div className="flex items-center justify-between border-b-4 border-[#D4A52C] pb-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="logo" className="h-20 w-20 rounded-full" />
            <div><h1 className="text-2xl font-medium text-[#0B2A5B]">{business}</h1><p className="text-xs text-slate-500">{address} {phone && `· ${phone}`}</p><p className="text-sm font-medium">Vehicle Rental Agreement</p></div>
          </div>
          <div className="text-end text-sm"><p className="font-mono font-medium">{b.id}</p><p className="text-slate-500">{fmtDateTime(b.createdAt)}</p></div>
        </div>
        <h2 className="mt-4 bg-[#0B2A5B] px-2 py-1 text-xs font-medium text-white">Customer</h2>
        <div className="grid grid-cols-3 gap-x-6"><F k="Name" v={c?.name} /><F k="Phone" v={c?.phone} /><F k="CNIC" v={c?.cnic} /><F k="Address" v={c?.address} /><F k="Customer ID" v={c?.id} /></div>
        <h2 className="mt-4 bg-[#0B2A5B] px-2 py-1 text-xs font-medium text-white">Guarantor</h2>
        <div className="grid grid-cols-3 gap-x-6"><F k="Name" v={b.guarantorName} /><F k="Phone" v={b.guarantorPhone} /><F k="CNIC" v={b.guarantorCnic} /><F k="Address" v={b.guarantorAddress} /></div>
        <h2 className="mt-4 bg-[#0B2A5B] px-2 py-1 text-xs font-medium text-white">Vehicle &amp; trip</h2>
        <div className="grid grid-cols-3 gap-x-6"><F k="Vehicle" v={v?.model} /><F k="Registration" v={v?.regNo} /><F k="Colour" v={v?.color} />
          <F k="Out" v={fmtDateTime(b.startAt)} /><F k="Return due" v={fmtDateTime(b.endAt)} /><F k="Duration" v={b.durationType === '12H' ? `12 hours ${b.shift ?? ''}` : 'Per day'} />
          <F k="Meter out" v={b.meterOut ? `${b.meterOut.toLocaleString()} km` : ''} /><F k="Fuel out" v={b.fuelOut} /><F k="Location" v={l?.name} />
          <F k="Booking type" v={b.bookingType} /><F k="Driver" v={d?.name ?? 'Self-drive'} /></div>
        <h2 className="mt-4 bg-[#0B2A5B] px-2 py-1 text-xs font-medium text-white">Charges</h2>
        <div className="grid grid-cols-4 gap-x-6"><F k="Rent" v={pkr(b.rentAmount)} /><F k="Driver" v={pkr(b.driverAmount)} /><F k="Total" v={pkr(b.totalAmount)} /><F k="Advance paid" v={pkr(bal.paid)} /><F k="Balance" v={pkr(bal.pending)} /></div>
        <div className="mt-4 grid grid-cols-3 gap-4">{img(c?.cnicFrontId, 'CNIC front')}{img(c?.cnicBackId, 'CNIC back')}{img(b.guarantorCnicId, 'Guarantor CNIC')}</div>
        {terms.length > 0 && <><h2 className="mt-4 bg-[#0B2A5B] px-2 py-1 text-xs font-medium text-white">Terms &amp; conditions</h2><ol className="mt-2 space-y-1 text-xs">{terms.map((t, i) => <li key={i}>{t}</li>)}</ol></>}
        <div className="mt-8 grid grid-cols-3 gap-6 text-center text-xs">
          <div>{b.signatureId ? img(b.signatureId, 'Customer signature') : <><div className="h-24 border-b border-slate-400" /><p className="text-slate-500">Customer signature</p></>}</div>
          <div>{b.thumbId ? img(b.thumbId, 'Thumb impression') : <><div className="mx-auto h-24 w-24 border border-slate-400" /><p className="text-slate-500">Thumb impression</p></>}</div>
          <div><div className="h-24 border-b border-slate-400" /><p className="text-slate-500">For {business}</p></div>
        </div>
      </div>
    </div>
  );
}
