'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, MessageCircle, X } from 'lucide-react';
import { pkr } from '@/lib/format';
import { submitLandingBooking, type InquiryResult } from '@/app/actions/landing';
import type { VehicleCardData } from './FleetExplorer';
import { PICKUP_HUBS, imageSrc, localInput, type DurationType, type TripDetail } from './options';

interface BookingModalProps {
  car: VehicleCardData;
  trip: TripDetail | null;
  onClose: () => void;
}

export function BookingModal({ car, trip, onClose }: BookingModalProps) {
  const [start, setStart] = useState(trip?.start ?? localInput(2));
  const [end, setEnd] = useState(trip?.end ?? localInput(26));
  const [durationType, setDurationType] = useState<DurationType>(trip?.durationType ?? 'DAY');
  const [bookingType, setBookingType] = useState('Self-drive');
  const [city, setCity] = useState<string>(trip?.city ?? PICKUP_HUBS[0].value);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<InquiryResult | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const photo = car.cardPhotoId || car.photoId;

  // Escape closes, focus moves into the dialog, page behind stops scrolling.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('input, select, button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('vehicleId', String(car.id));
      fd.set('start', start);
      fd.set('end', end);
      fd.set('durationType', durationType);
      fd.set('bookingType', bookingType);
      fd.set('city', city);
      fd.set('notes', notes);
      const result = await submitLandingBooking(fd);
      if (result.ok) setDone(result);
      else setError(result.error ?? 'The request could not be sent. Please try again.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'The connection dropped. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="reveal relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-panel shadow-modal sm:rounded-2xl"
      >
        <div className="flex items-center gap-4 border-b border-line p-5">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#101216]">
            {photo && <Image src={imageSrc(photo)} alt="" fill sizes="80px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <h3 id="booking-title" className="truncate text-[15px] font-medium text-ink">{car.model}</h3>
            <p className="mt-0.5 font-mono text-[13px] tabular-nums text-ink2">
              {pkr(car.rateDay)} / day · {pkr(car.rate12h)} / 12h
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-quiet ms-auto h-9 w-9 shrink-0 px-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {done ? (
          <div className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ok-soft text-ok">
              <Check size={20} strokeWidth={2} />
            </div>
            <h4 className="mt-4 text-lg font-medium text-ink">Request sent</h4>
            <p className="mt-1 text-sm text-ink2">The office will call {done.phone} to confirm the {done.vehicleModel}.</p>
            <dl className="mt-5 divide-y divide-line rounded-lg border border-line text-sm">
              <Row label="Reference" value={<span className="font-mono">{done.bookingId}</span>} />
              <Row label="Estimated rent" value={<span className="font-mono tabular-nums">{pkr(done.rentEstimate ?? 0)}</span>} />
            </dl>
            <div className="mt-6 grid gap-2">
              {done.whatsappUrl && (
                <a href={done.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary btn-lg">
                  <MessageCircle size={18} strokeWidth={1.5} />
                  Confirm on WhatsApp
                </a>
              )}
              <Link href="/portal/my" className="btn-ghost btn-lg">Track this booking</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 p-5">
            {error && <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-3 py-2.5 text-sm text-bad">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Pickup"><input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required className="input" /></Field>
              <Field label="Return"><input type="datetime-local" value={end} min={start} onChange={(e) => setEnd(e.target.value)} required className="input" /></Field>
              <Field label="Rental basis">
                <select value={durationType} onChange={(e) => setDurationType(e.target.value as DurationType)} className="input">
                  <option value="DAY">24-hour day</option>
                  <option value="12H">12-hour shift</option>
                </select>
              </Field>
              <Field label="Driver">
                <select value={bookingType} onChange={(e) => setBookingType(e.target.value)} className="input">
                  <option value="Self-drive">Self-drive</option>
                  <option value="With driver">With driver</option>
                </select>
              </Field>
            </div>

            <Field label="Full name"><input name="name" required autoComplete="name" maxLength={100} className="input" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone (WhatsApp)"><input type="tel" name="phone" required autoComplete="tel" inputMode="tel" placeholder="0300 1234567" className="input font-mono" /></Field>
              <Field label="CNIC"><input name="cnic" required inputMode="numeric" placeholder="35202-1234567-1" className="input font-mono" /></Field>
            </div>
            <Field label="Pickup hub">
              <select value={city} onChange={(e) => setCity(e.target.value)} className="input">
                {PICKUP_HUBS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </Field>
            <Field label="Notes (optional)">
              <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Flight number, child seat" className="input" />
            </Field>

            <p className="text-[13px] text-muted">No pre-payment. Nothing is charged until the office confirms with you.</p>
            <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full">
              {submitting ? 'Sending…' : 'Send booking request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
