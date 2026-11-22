'use client';

import { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, Sparkles, Phone } from 'lucide-react';
import { submitGeneralInquiry } from '@/app/actions/landing';

export function ConciergeSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const fd = new FormData(e.currentTarget);
      const res = await submitGeneralInquiry(fd);
      if (res.ok) {
        setSuccessMsg(res.message || 'Inquiry submitted successfully!');
        (e.target as HTMLFormElement).reset();
      } else {
        setErrorMsg(res.error || 'Failed to submit inquiry.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="concierge" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-surface relative overflow-hidden rounded-3xl p-8 shadow-2xl lg:p-12">
          {/* Subtle luminous background highlights */}
          <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-gold/10 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-navy-light/20 blur-[90px]" />

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-light">
                <Sparkles size={13} className="text-gold" />
                <span>Special Fleet Arrangements</span>
              </div>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                VIP Protocol, Wedding Convoys & Corporate Leasing
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Need multiple Land Cruisers, blacked-out Fortuners, or luxury sedans for weddings, state guests, or corporate delegations? 
                Our executive concierge plans every detail from security escorts to custom convoy timing.
              </p>

              <div className="mt-6 space-y-3 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold text-[10px] font-bold">✓</span>
                  <span>Bulletproof / Armored B6 & B7 vehicles on prior reservation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold text-[10px] font-bold">✓</span>
                  <span>VIP Airport Tarmac & Red Carpet terminal protocol clearance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold text-[10px] font-bold">✓</span>
                  <span>Custom monthly billing & dedicated account executive</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <a
                  href="https://wa.me/923000000000?text=Hello%20Seven%20Motors%20Concierge%2C%20I%20have%20a%20VIP%20fleet%20inquiry."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-900/40 transition"
                >
                  <MessageSquare size={14} />
                  <span>Direct WhatsApp Concierge</span>
                </a>
              </div>
            </div>

            {/* Right Inquiry Form */}
            <div className="liquid-card rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-bold text-white">Request a Tailored Fleet Proposal</h3>
              <p className="mt-1 text-xs text-white/60">
                Submit your convoy requirements and receive a detailed quote within 30 minutes.
              </p>

              {successMsg ? (
                <div className="my-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-6 text-center text-xs text-emerald-300">
                  <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-400" />
                  <strong className="block text-sm font-bold text-white">Request Logged in System!</strong>
                  <p className="mt-1">{successMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                  {errorMsg && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs text-rose-300">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Your Name / Organization
                    </label>
                    <input
                      name="name"
                      required
                      placeholder="e.g. Tariq Malik / Embassy Delegation"
                      className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                        Phone (WhatsApp)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="03001234567"
                        className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                        Requirement Type
                      </label>
                      <select
                        name="serviceType"
                        className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="Wedding Convoy" className="bg-navy-dark text-white">Wedding Convoy</option>
                        <option value="VIP Protocol" className="bg-navy-dark text-white">VIP Protocol / State Guest</option>
                        <option value="Corporate Monthly Lease" className="bg-navy-dark text-white">Corporate Monthly Lease</option>
                        <option value="Airport Multi-Van Transfer" className="bg-navy-dark text-white">Airport Multi-Van Transfer</option>
                        <option value="Northern Areas Tour" className="bg-navy-dark text-white">Northern Areas Tour (Prado/Fortuner)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Details / Number of Vehicles / Specific Dates
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      placeholder="Tell us about the dates, route, vehicle models, or special requests..."
                      className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-gold flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Sending Query...</span>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Submit VIP Query</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
