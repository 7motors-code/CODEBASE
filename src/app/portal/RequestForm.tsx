'use client';
import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { Submit } from '@/components/client';
import { requestBooking, type PortalFormState } from './actions';

interface Rates { rateDay: number; rate12h: number }

const HOUR = 3_600_000;
const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString('en-PK')}`;

/** Same rounding the office uses: every started 24 h (or 12 h) block is charged. */
function estimate(start: string, end: string, type: string, r: Rates) {
  const h = (new Date(end).getTime() - new Date(start).getTime()) / HOUR;
  if (!(h > 0)) return null;
  const blocks = Math.ceil(h / (type === '12H' ? 12 : 24) - 1e-9);
  return { blocks, rent: blocks * (type === '12H' ? r.rate12h : r.rateDay) };
}

/**
 * Booking request form. Errors come back as form state, so everything the customer typed stays
 * on screen (a redirect would wipe the fields).
 */
export function RequestForm({ vehicleId, rates, start: s0, end: e0, min }: { vehicleId: number; rates: Rates; start: string; end: string; min: string }) {
  const [state, action] = useFormState<PortalFormState, FormData>(requestBooking, { error: null, at: 0 });
  const [start, setStart] = useState(s0);
  const [end, setEnd] = useState(e0);
  const [type, setType] = useState('DAY');
  const errRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.error) errRef.current?.focus(); }, [state]);
  const est = start && end ? estimate(start, end, type, rates) : null;

  return (
    <form action={action} className="space-y-3">
      {state.error && <p ref={errRef} tabIndex={-1} role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad outline-none">{state.error}</p>}
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block"><span className="label">Pick-up <span aria-hidden className="text-bad">*</span></span>
          <input type="datetime-local" name="start" required min={min} value={start} onChange={(e) => setStart(e.target.value)} className="input" /></label>
        <label className="block"><span className="label">Return <span aria-hidden className="text-bad">*</span></span>
          <input type="datetime-local" name="end" required min={start || min} value={end} onChange={(e) => setEnd(e.target.value)} className="input" /></label>
      </div>
      <label className="block"><span className="label">Rent by</span>
        <select name="durationType" value={type} onChange={(e) => setType(e.target.value)} aria-describedby="rent-hint" className="input">
          <option value="DAY">Per day (24 hours)</option><option value="12H">12-hour shift</option>
        </select></label>
      <p id="rent-hint" className="text-[13px] text-ink2" aria-live="polite">
        {est
          ? <>Estimated rent <span className="font-mono font-medium tabular-nums text-ink"><bdi dir="ltr">{pkr(est.rent)}</bdi></span> for {est.blocks} {type === '12H' ? 'shift' : 'day'}{est.blocks === 1 ? '' : 's'}. Every started {type === '12H' ? '12 hours' : '24 hours'} counts as one.</>
          : <>Every started {type === '12H' ? '12 hours' : '24 hours'} is charged as one.</>}
      </p>
      <label className="block"><span className="label">Full name <span aria-hidden className="text-bad">*</span></span>
        <input name="name" required maxLength={100} autoComplete="name" className="input" /></label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block"><span className="label">Mobile number <span aria-hidden className="text-bad">*</span></span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={20} className="input font-mono" placeholder="03XX XXXXXXX" /></label>
        <label className="block"><span className="label">CNIC <span aria-hidden className="text-bad">*</span></span>
          <input name="cnic" required inputMode="numeric" autoComplete="off" maxLength={20} aria-describedby="cnic-hint" className="input font-mono" placeholder="00000-0000000-0" />
          <span id="cnic-hint" className="mt-1 block text-xs text-ink2">13 digits, with or without dashes</span></label>
      </div>
      <label className="block"><span className="label">Address</span><input name="address" maxLength={300} autoComplete="street-address" className="input" /></label>
      <label className="block"><span className="label">Notes</span><input name="notes" maxLength={1000} className="input" placeholder="Pickup place, driver needed" /></label>
      <p className="text-xs text-ink2"><span aria-hidden className="text-bad">*</span> Required. This is a request: the office confirms by phone. Bring your original CNIC when you pick up the car.</p>
      <Submit className="btn-primary btn-lg w-full" pendingText="Sending…">Send booking request</Submit>
    </form>
  );
}
