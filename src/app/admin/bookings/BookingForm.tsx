'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Search, Fingerprint } from 'lucide-react';
import { ImageInput, SignaturePad } from '@/components/client';

type V = { id: number; model: string; regNo: string; rateDay: number; rate12h: number; meterReading: number };
type D = { id: number; name: string; perDayFee: number; paymentBasis: string };
type C = { id: string; name: string; phone: string; cnic: string | null; address: string | null; email: string | null; isCredit: boolean; status: string };
type L = { id: number; name: string };
type Existing = {
  id: string; customerId: string; vehicleId: number; driverId: number | null; locationId: number | null; bookingType: string | null;
  durationType: string; shift: string | null; start: string; end: string; fuelOut: string | null; meterOut: number | null;
  rentAmount: number; driverAmount: number; totalAmount: number; advanceAmount: number; notes: string | null;
  guarantorName: string | null; guarantorPhone: string | null; guarantorCnic: string | null; guarantorAddress: string | null;
};

const H = 3600000;
function units(start: string, end: string, type: string) {
  const s = new Date(start), e = new Date(end);
  const h = (e.getTime() - s.getTime()) / H;
  if (!(h > 0)) return 0;
  return Math.ceil(h / (type === '12H' ? 12 : 24) - 1e-9);
}
const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString('en-US')}`;

function Buttons({ edit }: { edit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-line bg-panel/95 py-4 backdrop-blur">
      <Link href="/admin/bookings" className="btn-ghost">Cancel</Link>
      {!edit && <button className="btn-ghost" name="intent" value="print" disabled={pending}>{pending ? 'Saving…' : 'Print & Add'}</button>}
      <button className="btn-gold" name="intent" value="save" disabled={pending}>{pending ? 'Saving…' : edit ? 'Save changes' : 'Add'}</button>
    </div>
  );
}

export default function BookingForm({ action, bookingId, vehicles, drivers, customers, locations, types, now, existing, err }: {
  action: (fd: FormData) => void; bookingId: string; vehicles: V[]; drivers: D[]; customers: C[]; locations: L[]; types: string[]; now: string; existing?: Existing; err?: string;
}) {
  const ex = existing;
  const [cust, setCust] = useState<Partial<C>>(ex ? customers.find((c) => c.id === ex.customerId) ?? {} : {});
  const [lookup, setLookup] = useState('');
  const [showLookup, setShowLookup] = useState(false);
  const [selected, setSelected] = useState<number[]>(ex ? [ex.vehicleId] : []);
  const [vq, setVq] = useState('');
  const [durationType, setDurationType] = useState(ex?.durationType ?? 'DAY');
  const [start, setStart] = useState(ex?.start ?? now);
  const [end, setEnd] = useState(ex?.end ?? '');
  const [driverId, setDriverId] = useState<string>(ex?.driverId ? String(ex.driverId) : '');
  const [driverDur, setDriverDur] = useState('DAY');
  const [driverAmount, setDriverAmount] = useState<number | ''>(ex ? ex.driverAmount : '');
  const [driverTouched, setDriverTouched] = useState(!!ex);
  const [total, setTotal] = useState<number | ''>(ex ? ex.totalAmount : '');
  const [totalTouched, setTotalTouched] = useState(!!ex);
  const [advance, setAdvance] = useState<number>(ex?.advanceAmount ?? 0);
  const [busy, setBusy] = useState<{ vehicles: number[]; drivers: number[] }>({ vehicles: [], drivers: [] });

  useEffect(() => {
    if (!start || !end) return;
    const ctl = new AbortController();
    fetch(`/api/availability?start=${start}&end=${end}${ex ? `&ignore=${ex.id}` : ''}`, { signal: ctl.signal }).then((r) => r.json()).then(setBusy).catch(() => {});
    return () => ctl.abort();
  }, [start, end, ex]);

  const u = units(start, end, durationType);
  const rent = useMemo(() => selected.reduce((s, id) => { const v = vehicles.find((x) => x.id === id); return s + (v ? (durationType === '12H' ? v.rate12h : v.rateDay) * u : 0); }, 0), [selected, vehicles, durationType, u]);
  const drv = drivers.find((d) => String(d.id) === driverId);
  const autoDriver = drv ? drv.perDayFee * units(start, end, driverDur) * (driverDur === '12H' ? 0.5 : 1) : 0;
  const dAmt = driverTouched ? Number(driverAmount || 0) : autoDriver;
  const autoTotal = rent + dAmt;
  const tot = totalTouched ? Number(total || 0) : autoTotal;
  const pending = Math.max(0, tot - advance);
  const meter = selected.length === 1 ? vehicles.find((v) => v.id === selected[0])?.meterReading : undefined;

  const matches = lookup.length >= 1 ? customers.filter((c) => `${c.name} ${c.phone} ${c.cnic ?? ''} ${c.id}`.toLowerCase().includes(lookup.toLowerCase())).slice(0, 8) : customers.slice(0, 8);
  const vList = vehicles.filter((v) => `${v.model} ${v.regNo}`.toLowerCase().includes(vq.toLowerCase()));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="customerId" value={cust.id ?? ''} />
      {selected.map((id) => <input key={id} type="hidden" name="vehicleIds" value={id} />)}
      <input type="hidden" name="rentAmount" value={rent} />
      {err && <p className="rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-300">{err}</p>}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4">
        <span className="text-xs font-semibold uppercase text-muted">Booking ID</span>
        <span className="font-mono text-lg font-bold text-gold">{bookingId}</span>
        {selected.length > 1 && <span className="badge bg-sky-500/15 text-sky-400">Group booking · {selected.length} cars (one booking per car)</span>}
      </div>

      <section className="card p-5">
        <h3 className="mb-4 font-bold text-gold">Customer details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block"><span className="label">Customer name <span className="text-rose-400">*</span></span>
            <div className="relative flex gap-2">
              <input name="customerName" required value={cust.name ?? ''} onChange={(e) => setCust({ ...cust, name: e.target.value, id: undefined })} className="input" placeholder="Full name" />
              <button type="button" className="btn-ghost" onClick={() => setShowLookup(!showLookup)} title="Pick existing customer"><Search size={16} /></button>
              {showLookup && (
                <div className="absolute end-0 top-12 z-20 w-full rounded-xl border border-line bg-panel p-2 shadow-2xl">
                  <input autoFocus value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Search name, phone, CNIC…" className="input mb-2" />
                  {matches.map((c) => (
                    <button type="button" key={c.id} disabled={c.status === 'BLOCKED'} onClick={() => { setCust(c); setShowLookup(false); }}
                      className="block w-full rounded-lg px-2 py-1.5 text-start text-sm hover:bg-panel2 disabled:opacity-40">
                      <span className="font-semibold">{c.name}</span> <span className="text-muted">· {c.phone}{c.isCredit ? ' · Credit' : ''}{c.status === 'BLOCKED' ? ' · BLOCKED' : ''}</span>
                    </button>))}
                  {matches.length === 0 && <p className="p-2 text-sm text-muted">No match — fill the form to add a new customer.</p>}
                </div>)}
            </div>
            {cust.id && <span className="mt-1 block text-xs text-emerald-400">Existing customer {cust.id}{cust.isCredit ? ' (credit customer)' : ''}</span>}
          </label>
          <label className="block"><span className="label">Customer phone <span className="text-rose-400">*</span></span>
            <div className="flex"><span className="flex items-center rounded-s-xl border border-e-0 border-line bg-panel px-3 text-sm text-muted">+92</span>
              <input name="customerPhone" required value={cust.phone ?? ''} onChange={(e) => setCust({ ...cust, phone: e.target.value })} className="input rounded-s-none" placeholder="03XX XXXXXXX" /></div></label>
          <label className="block"><span className="label">Customer ID card (CNIC) <span className="text-rose-400">*</span></span>
            <input name="customerCnic" required value={cust.cnic ?? ''} onChange={(e) => setCust({ ...cust, cnic: e.target.value })} pattern="\d{5}-?\d{7}-?\d" title="00000-0000000-0" className="input" placeholder="00000-0000000-0" /></label>
          <label className="block"><span className="label">Customer address</span>
            <input name="customerAddress" value={cust.address ?? ''} onChange={(e) => setCust({ ...cust, address: e.target.value })} className="input" /></label>
          <ImageInput name="cnicFront" label="CNIC front side" />
          <ImageInput name="cnicBack" label="CNIC back side" />
        </div>
      </section>

      <section className="card p-5">
        <h3 className="mb-4 font-bold text-gold">Guarantor details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block"><span className="label">Guarantor name</span><input name="guarantorName" defaultValue={ex?.guarantorName ?? ''} className="input" /></label>
          <label className="block"><span className="label">Guarantor phone no</span><input name="guarantorPhone" defaultValue={ex?.guarantorPhone ?? ''} className="input" /></label>
          <label className="block"><span className="label">Guarantor CNIC</span><input name="guarantorCnic" defaultValue={ex?.guarantorCnic ?? ''} className="input" placeholder="00000-0000000-0" /></label>
          <label className="block"><span className="label">Guarantor address</span><input name="guarantorAddress" defaultValue={ex?.guarantorAddress ?? ''} className="input" /></label>
          <ImageInput name="guarantorCnicImage" label="Guarantor CNIC image" />
        </div>
      </section>

      {!ex && (
        <section className="card p-5">
          <h3 className="mb-4 font-bold text-gold">Verification</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div><span className="label">Customer signature</span><SignaturePad name="signature" /><p className="mt-2 text-xs text-muted">…or upload a signature image:</p><input type="file" name="signatureFile" accept="image/*" className="mt-1 text-xs" /></div>
            <div><span className="label">Customer thumb impression</span>
              <div className="rounded-xl border border-dashed border-line bg-panel2 p-4 text-sm">
                <p className="mb-2 flex items-center gap-2 font-semibold"><Fingerprint size={18} className="text-gold" /> Scan Thumb</p>
                <p className="mb-3 text-xs text-muted">Upload the image saved by your fingerprint scanner (or a photo of the thumb impression on paper).</p>
                <input type="file" name="thumb" accept="image/*" className="text-xs" />
              </div></div>
          </div>
        </section>)}

      <section className="card p-5">
        <h3 className="mb-4 font-bold text-gold">Schedule</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block"><span className="label">Duration type</span>
            <select name="durationType" value={durationType} onChange={(e) => setDurationType(e.target.value)} className="input"><option value="DAY">Per day (24 h)</option><option value="12H">12 hours</option></select></label>
          {durationType === '12H' && <label className="block"><span className="label">Booking shift</span><select name="shift" defaultValue={ex?.shift ?? 'DAY'} className="input"><option value="DAY">Day</option><option value="NIGHT">Night</option></select></label>}
          <label className="block"><span className="label">Start date &amp; time <span className="text-rose-400">*</span></span><input type="datetime-local" name="start" required value={start} onChange={(e) => setStart(e.target.value)} className="input" /></label>
          <label className="block"><span className="label">End date &amp; time <span className="text-rose-400">*</span></span><input type="datetime-local" name="end" required value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="input" /></label>
        </div>
        <p className="mt-2 text-xs text-muted">{u > 0 ? `${u} ${durationType === '12H' ? '12-hour shift(s)' : 'day(s)'}` : 'Pick start and end to see availability and price.'}</p>
      </section>

      <section className="card p-5">
        <h3 className="mb-4 font-bold text-gold">Vehicle &amp; trip</h3>
        <input value={vq} onChange={(e) => setVq(e.target.value)} placeholder="Search vehicle by model or plate…" className="input mb-3" />
        <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {vList.map((v) => {
            const isBusy = busy.vehicles.includes(v.id);
            const on = selected.includes(v.id);
            return (
              <button type="button" key={v.id} disabled={isBusy && !on} onClick={() => setSelected(on ? selected.filter((x) => x !== v.id) : ex ? [v.id] : [...selected, v.id])}
                className={`rounded-xl border p-3 text-start text-sm transition ${on ? 'border-gold bg-gold/10' : 'border-line bg-panel2 hover:border-gold/50'} disabled:cursor-not-allowed disabled:opacity-40`}>
                <span className="block font-semibold">{v.model} <span className="text-muted">({v.regNo})</span></span>
                <span className="block text-xs text-muted">{pkr(v.rateDay)}/day · {pkr(v.rate12h)}/12h</span>
                {isBusy && <span className="text-xs text-rose-400">Booked for these dates</span>}
              </button>);
          })}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <label className="block"><span className="label">Fuel level (optional)</span><select name="fuelOut" defaultValue={ex?.fuelOut ?? ''} className="input"><option value="">—</option>{['Empty', '1/4', '1/2', '3/4', 'Full'].map((f) => <option key={f}>{f}</option>)}</select></label>
          <label className="block"><span className="label">Meter reading (out)</span><input type="number" name="meterOut" defaultValue={ex?.meterOut ?? meter ?? ''} key={meter} className="input" placeholder={meter ? String(meter) : 'km'} /></label>
          <label className="block"><span className="label">Booking type</span><select name="bookingType" defaultValue={ex?.bookingType ?? types[0]} className="input">{types.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="block"><span className="label">Location</span><select name="locationId" defaultValue={ex?.locationId ?? ''} className="input"><option value="">—</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="mb-4 font-bold text-gold">Driver (optional)</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block"><span className="label">Driver name</span>
            <select name="driverId" value={driverId} onChange={(e) => { setDriverId(e.target.value); setDriverTouched(false); }} className="input">
              <option value="">No driver (self-drive)</option>
              {drivers.map((d) => <option key={d.id} value={d.id} disabled={busy.drivers.includes(d.id)}>{d.name} · {pkr(d.perDayFee)}/day{busy.drivers.includes(d.id) ? ' (busy)' : ''}</option>)}
            </select></label>
          <label className="block"><span className="label">Driver duration</span><select value={driverDur} onChange={(e) => { setDriverDur(e.target.value); setDriverTouched(false); }} className="input"><option value="DAY">Per day</option><option value="12H">12 hours (half day fee)</option></select></label>
          <label className="block"><span className="label">Driver amount (PKR)</span><input type="number" name="driverAmount" min={0} value={driverTouched ? driverAmount : autoDriver} onChange={(e) => { setDriverTouched(true); setDriverAmount(e.target.value === '' ? '' : Number(e.target.value)); }} className="input" /></label>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="mb-4 font-bold text-gold">Payment</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-panel2 p-3"><p className="text-xs text-muted">Rent ({selected.length} car{selected.length === 1 ? '' : 's'})</p><p className="text-lg font-bold">{pkr(rent)}</p></div>
          <label className="block"><span className="label">Total amount (PKR)</span><input type="number" name="totalAmount" min={0} value={totalTouched ? total : autoTotal} onChange={(e) => { setTotalTouched(true); setTotal(e.target.value === '' ? '' : Number(e.target.value)); }} className="input text-lg font-bold" />
            {totalTouched && tot !== autoTotal && <span className="mt-1 block text-xs text-amber-400">Changed from {pkr(autoTotal)} — reason required below. <button type="button" className="link" onClick={() => setTotalTouched(false)}>Reset</button></span>}</label>
          <label className="block"><span className="label">Advance amount (PKR)</span><input type="number" name="advanceAmount" min={0} value={advance} onChange={(e) => setAdvance(Number(e.target.value || 0))} className="input" disabled={!!ex} /></label>
          <div className="rounded-xl bg-rose-500/10 p-3"><p className="text-xs text-muted">Pending amount</p><p className="text-lg font-bold text-rose-400">{pkr(pending)}</p></div>
        </div>
        {!ex && <label className="mt-3 block w-56"><span className="label">Advance paid by</span><select name="advanceMethod" className="input">{['Cash', 'Bank transfer', 'JazzCash', 'Easypaisa', 'Card'].map((m) => <option key={m}>{m}</option>)}</select></label>}
        {totalTouched && tot !== autoTotal && <label className="mt-3 block"><span className="label">Reason for changing the total <span className="text-rose-400">*</span></span><input name="overrideReason" required className="input" placeholder="e.g. regular customer discount" /></label>}
        {selected.length > 1 && totalTouched && <p className="mt-2 text-xs text-amber-400">For group bookings the total is split between the cars in proportion to their rent.</p>}
        <label className="mt-3 block"><span className="label">Notes</span><textarea name="notes" defaultValue={ex?.notes ?? ''} rows={2} className="input" /></label>
      </section>
      <Buttons edit={!!ex} />
    </form>
  );
}
