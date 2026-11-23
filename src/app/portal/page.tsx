import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { vehicleClash } from '@/lib/calc';
import { parsePk, pkInput, pkr } from '@/lib/format';
import { X } from 'lucide-react';
import { Plate, Thumb } from '@/components/ui';
import { Submit } from '@/components/client';
import { requestBooking } from './actions';

export default async function Portal({ searchParams: sp }: { searchParams: { start?: string; end?: string; car?: string; err?: string; category?: string } }) {
  const cars = await db.select().from(schema.vehicles).where(eq(schema.vehicles.active, true)).orderBy(schema.vehicles.rateDay);
  const start = parsePk(sp.start ?? ''), end = parsePk(sp.end ?? '');
  const checking = !!(start && end && end > start);
  const free = new Map<number, boolean>();
  if (checking) for (const c of cars) free.set(c.id, !(await vehicleClash(c.id, start!, end!)));
  const cats = Array.from(new Set(cars.map((c) => c.category)));
  const list = cars.filter((c) => !sp.category || c.category === sp.category);
  const chosen = sp.car ? cars.find((c) => c.id === Number(sp.car)) : undefined;
  const now = pkInput(new Date(Date.now() + 3600000));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-medium tracking-[-0.01em] text-ink">Find a car</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink2">Pick your dates to see which cars are free, then send a request. The office calls you to confirm.</p>
        <form method="get" className="card mt-6 grid gap-3 p-4 md:grid-cols-[1fr_1fr_200px_auto]">
          <label className="block"><span className="label">Pickup</span><input type="datetime-local" name="start" defaultValue={sp.start ?? now} className="input" /></label>
          <label className="block"><span className="label">Return</span><input type="datetime-local" name="end" defaultValue={sp.end} className="input" /></label>
          <label className="block"><span className="label">Type</span><select name="category" defaultValue={sp.category} className="input"><option value="">All types</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></label>
          <button className="btn-primary self-end">Check availability</button>
        </form>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const ok = !checking || free.get(c.id);
          return (
            <div key={c.id} className={`card overflow-hidden ${ok ? '' : 'opacity-50'}`}>
              {c.cardPhotoId || c.photoId ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={(c.cardPhotoId ?? c.photoId)!.startsWith('/') ? (c.cardPhotoId ?? c.photoId)! : `/api/files/${c.cardPhotoId ?? c.photoId}`} alt={c.model} className="aspect-[16/10] w-full bg-[#101216] object-cover" /> : <div className="flex aspect-[16/10] items-center justify-center bg-panel2 text-sm text-muted">{c.model}</div>}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3"><p className="text-[15px] font-medium text-ink">{c.model}</p><Plate reg={c.regNo} /></div>
                <p className="mt-1 text-[13px] text-muted">{[c.category, c.color].filter(Boolean).join(' · ')}</p>
                <div className="mt-5 flex items-end justify-between gap-3"><div><p className="font-mono text-lg font-medium tabular-nums text-ink">{pkr(c.rateDay)}<span className="ms-1 font-sans text-[13px] font-normal text-muted">/ day</span></p><p className="font-mono text-[13px] tabular-nums text-ink2">{pkr(c.rate12h)}<span className="ms-1 font-sans text-muted">/ 12h</span></p></div>
                  {ok ? <Link href={`/portal?car=${c.id}&start=${sp.start ?? now}&end=${sp.end ?? ''}`} className="btn-ghost">Request</Link> : <span className="text-[13px] text-bad">Not free on these dates</span>}</div>
              </div>
            </div>);
        })}
      </div>
      {chosen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 md:p-10" role="dialog" aria-modal="true">
          <div className="reveal w-full max-w-lg rounded-2xl border border-line bg-panel p-6 shadow-modal">
            <div className="mb-4 flex items-center gap-3"><Thumb id={chosen.cardPhotoId ?? chosen.photoId} alt="" size={64} /><div className="min-w-0"><p className="truncate text-[15px] font-medium text-ink">{chosen.model}</p><p className="font-mono text-[13px] tabular-nums text-ink2">{pkr(chosen.rateDay)} / day · {pkr(chosen.rate12h)} / 12h</p></div><Link href="/portal" aria-label="Close" className="btn-quiet ms-auto h-9 w-9 shrink-0 px-0"><X size={18} strokeWidth={1.5} /></Link></div>
            {sp.err && <p className="mb-3 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">{sp.err}</p>}
            <form action={requestBooking} className="space-y-3">
              <input type="hidden" name="vehicleId" value={chosen.id} />
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="label">Pick-up</span><input type="datetime-local" name="start" required defaultValue={sp.start} className="input" /></label>
                <label className="block"><span className="label">Return</span><input type="datetime-local" name="end" required defaultValue={sp.end} className="input" /></label>
              </div>
              <label className="block"><span className="label">Rent by</span><select name="durationType" className="input"><option value="DAY">Per day</option><option value="12H">12 hours</option></select></label>
              <label className="block"><span className="label">Full name</span><input name="name" required className="input" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="label">Phone</span><input name="phone" required className="input" placeholder="03XX XXXXXXX" /></label>
                <label className="block"><span className="label">CNIC</span><input name="cnic" required className="input" placeholder="00000-0000000-0" /></label>
              </div>
              <label className="block"><span className="label">Address</span><input name="address" className="input" /></label>
              <label className="block"><span className="label">Notes</span><input name="notes" className="input" placeholder="Pickup place, driver needed" /></label>
              <p className="text-xs text-muted">This is a request. The office will confirm by phone. Bring your original CNIC when picking up the car.</p>
              <Submit className="btn-primary btn-lg w-full">Send booking request</Submit>
            </form>
          </div>
        </div>)}
    </div>
  );
}
