'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, MessageCircle } from 'lucide-react';
import { submitGeneralInquiry } from '@/app/actions/landing';
import { CONCIERGE_SERVICES } from './options';

const SERVICES = CONCIERGE_SERVICES;
const OFFER = [
  'One quote for the whole group of cars',
  'Monthly billing for companies',
  'Drivers on request for every car',
] as const;

export function ConciergeSection({ whatsappHref }: { whatsappHref: string | null }) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);
  // The form unmounts on success, so move focus to the confirmation.
  useEffect(() => { if (success) doneRef.current?.focus(); }, [success]);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitGeneralInquiry(new FormData(form));
      if (res.ok) {
        setSuccess(res.message ?? 'Request received');
        form.reset();
      } else {
        setError(res.error ?? 'The request could not be sent. Please try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'The connection dropped. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="concierge" data-surface="dark" className="relative scroll-mt-20 overflow-hidden bg-navy-dark py-20 text-white md:py-28">
      <Image src="/cars/land-cruiser.jpg" alt="" fill sizes="100vw" className="object-cover object-right opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-navy-dark via-navy-dark/85 to-navy-dark/20" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div data-reveal>
          <h2 className="display text-[34px] leading-[1.08] md:text-5xl">Several cars <span className="text-gold">at once</span></h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
            Weddings, company contracts, visiting delegations and family trips up north. Tell us the dates and how many cars, and the office sends one quote.
          </p>
          <ul className="mt-8 space-y-3">
            {OFFER.map((item) => (
              <li key={item} className="flex items-center gap-3 text-base font-medium text-white">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-navy-dark" aria-hidden><Check size={14} strokeWidth={2.5} /></span>
                {item}
              </li>
            ))}
          </ul>
          {whatsappHref && (
            <a
              href={`${whatsappHref}?text=${encodeURIComponent('Hello Seven Motors, I need a quote for several cars.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-on-dark btn-lg mt-8"
            >
              <MessageCircle size={18} strokeWidth={1.75} />
              Ask on WhatsApp
            </a>
          )}
        </div>

        <div data-surface="light" data-reveal="scale" style={{ ['--d' as string]: '120ms' }} className="rounded-2xl bg-panel p-6 text-ink shadow-modal sm:p-8">
          <h3 className="text-xl font-bold tracking-[-0.01em] text-ink">Request a quote</h3>
          <p className="mt-1 text-sm text-ink2">The office calls back on the number you leave</p>

          <div role="status" aria-live="polite">
          {success && (
            <div className="mt-6 rounded-xl border border-line bg-panel p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ok-soft text-ok">
                <Check size={20} strokeWidth={2} />
              </div>
              <p ref={doneRef} tabIndex={-1} className="mt-4 text-[15px] font-medium text-ink outline-none">Request received</p>
              <p className="mt-1 text-sm text-ink2">{success}</p>
              <button type="button" onClick={() => setSuccess(null)} className="btn-ghost mt-5">Send another</button>
            </div>
          )}
          </div>
          {!success && (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {error && <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-3 py-2.5 text-sm text-bad">{error}</p>}
              <label className="block">
                <span className="label">Name or organisation</span>
                <input name="name" required maxLength={100} autoComplete="name" className="input" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Phone (WhatsApp)</span>
                  <input type="tel" name="phone" required autoComplete="tel" inputMode="tel" placeholder="0300 1234567" className="input font-mono" />
                </label>
                <label className="block">
                  <span className="label">What for</span>
                  <select name="serviceType" className="input">
                    {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="label">Dates, number of cars, route</span>
                <textarea name="message" rows={4} maxLength={1000} className="input resize-none" />
              </label>
              <button type="submit" disabled={submitting} className="btn-accent btn-lg w-full">
                {submitting ? 'Sending…' : 'Send request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
