import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { vehicleClash } from '@/lib/calc';
import { parsePk, pkInput, pkr } from '@/lib/format';
import { Thumb } from '@/components/ui';
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
      <div className="rounded-3xl bg-gradient-to-br from-navy to-navy-light p-6 text-white md:p-10">
        <h1 className="text-3xl font-extrabold md:text-4xl">Find your car</h1>
        <p className="mt-2 text-white/70">Pick your dates to see which cars are free, then send a booking request. Our team will call you to confirm.</p>
        <form method="get" className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <label className="text-xs uppercase text-white/60">Pick-up<input type="datetime-local" name="start" defaultValue={sp.start ?? now} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-white" /></label>
          <label className="text-xs uppercase text-white/60">Return<input type="datetime-local" name="end" defaultValue={sp.end} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-white" /></label>
          <label className="text-xs uppercase text-white/60">Type<select name="category" defaultValue={sp.category} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-white"><option value="" className="text-black">All</option>{cats.map((c) => <option key={c} className="text-black">{c}</option>)}</select></label>
          <button className="btn-gold self-end py-2.5">Check availability</button>
        </form>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const ok = !checking || free.get(c.id);
          return (
            <div key={c.id} className={`card overflow-hidden ${ok ? '' : 'opacity-50'}`}>
              {c.cardPhotoId || c.photoId ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/files/${c.cardPhotoId ?? c.photoId}`} alt={c.model} className="h-48 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-panel2 text-muted">{c.model}</div>}
              <div className="p-4">
                <p className="text-lg font-bold">{c.model}</p><p className="text-xs text-muted">{c.category} · {c.color}</p>
                <div className="mt-3 flex items-end justify-between"><div><p className="text-xl font-extrabold text-gold">{pkr(c.rateDay)}<span className="text-xs font-normal text-muted">/day</span></p><p className="text-xs text-muted">{pkr(c.rate12h)} for 12 hours</p></div>
                  {ok ? <Link href={`/portal?car=${c.id}&start=${sp.start ?? now}&end=${sp.end ?? ''}`} className="btn-gold btn-sm">Book</Link> : <span className="text-xs text-rose-400">Not free on these dates</span>}</div>
              </div>
            </div>);
        })}
      </div>
      {chosen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:p-10">
          <div className="card w-full max-w-lg p-6">
            <div className="mb-4 flex items-center gap-3"><Thumb id={chosen.cardPhotoId ?? chosen.photoId} alt="" size={64} /><div><p className="text-lg font-bold">{chosen.model}</p><p className="text-sm text-muted">{pkr(chosen.rateDay)}/day · {pkr(chosen.rate12h)}/12h</p></div><Link href="/portal" className="ms-auto text-muted">✕</Link></div>
            {sp.err && <p className="mb-3 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-300">{sp.err}</p>}
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
              <label className="block"><span className="label">Notes</span><input name="notes" className="input" placeholder="Pickup place, driver needed…" /></label>
              <p className="text-xs text-muted">This is a request. The office will confirm by phone. Bring your original CNIC when picking up the car.</p>
              <Submit className="btn-gold w-full">Send booking request</Submit>
            </form>
          </div>
        </div>)}
    </div>
  );
}
