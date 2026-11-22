'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Car,
  Fuel,
  Users,
  CheckCircle2,
  Calendar,
  Phone,
  Shield,
  X,
  Clock,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { pkr } from '@/lib/format';
import { submitLandingBooking, InquiryResult } from '@/app/actions/landing';

export interface VehicleCardData {
  id: number;
  model: string;
  category: string;
  color: string | null;
  rateDay: number;
  rate12h: number;
  photoId: string | null;
  cardPhotoId: string | null;
  meterReading: number;
  regNo: string;
}

export function FleetExplorer({
  vehicles,
  initialStart,
  initialEnd,
  initialCity = 'Islamabad',
}: {
  vehicles: VehicleCardData[];
  initialStart?: string;
  initialEnd?: string;
  initialCity?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc'>('recommended');
  const [pageLimit, setPageLimit] = useState<number>(6);
  const [isPending, startTransition] = useTransition();

  // Selected car for booking inquiry modal
  const [selectedCar, setSelectedCar] = useState<VehicleCardData | null>(null);
  const [bookingStart, setBookingStart] = useState<string>(initialStart || '');
  const [bookingEnd, setBookingEnd] = useState<string>(initialEnd || '');
  const [durationType, setDurationType] = useState<'DAY' | '12H'>('DAY');
  const [bookingType, setBookingType] = useState<string>('Self-drive');
  const [pickupCity, setPickupCity] = useState<string>(initialCity);
  const [notes, setNotes] = useState<string>('');

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<InquiryResult | null>(null);

  // 300ms Debounce effect for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedQuery(searchInput.trim());
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Set default dates if empty
  useEffect(() => {
    if (!bookingStart) {
      const s = new Date(Date.now() + 2 * 3600000);
      setBookingStart(s.toISOString().slice(0, 16));
    }
    if (!bookingEnd) {
      const e = new Date(Date.now() + 26 * 3600000);
      setBookingEnd(e.toISOString().slice(0, 16));
    }
  }, [bookingStart, bookingEnd]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(vehicles.map((v) => v.category));
    return ['ALL', ...Array.from(set)];
  }, [vehicles]);

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    let list = vehicles;

    if (selectedCategory !== 'ALL') {
      list = list.filter((v) => v.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.model.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          (v.color && v.color.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.rateDay - b.rateDay);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.rateDay - a.rateDay);
    }

    return list;
  }, [vehicles, selectedCategory, debouncedQuery, sortBy]);

  const visibleVehicles = useMemo(() => {
    return filteredVehicles.slice(0, pageLimit);
  }, [filteredVehicles, pageLimit]);

  const handleOpenBooking = (car: VehicleCardData) => {
    setSelectedCar(car);
    setSubmissionError(null);
    setSubmissionSuccess(null);
  };

  const handleCloseModal = () => {
    setSelectedCar(null);
    setSubmissionError(null);
    setSubmissionSuccess(null);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCar) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const fd = new FormData(e.currentTarget);
      fd.set('vehicleId', String(selectedCar.id));
      fd.set('start', bookingStart);
      fd.set('end', bookingEnd);
      fd.set('durationType', durationType);
      fd.set('bookingType', bookingType);
      fd.set('city', pickupCity);
      fd.set('notes', notes);

      const result = await submitLandingBooking(fd);
      if (result.ok) {
        setSubmissionSuccess(result);
      } else {
        setSubmissionError(result.error || 'Failed to submit booking request.');
      }
    } catch (err: any) {
      setSubmissionError(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="fleet" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-light">
              <Car size={13} />
              <span>Available Showroom Fleet</span>
            </div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Select Your Preferred Vehicle
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Each vehicle is thoroughly sanitized, fully insured, and GPS-equipped with 24/7 breakdown assistance.
            </p>
          </div>

          <div className="text-xs text-white/60">
            Showing <strong className="text-white">{filteredVehicles.length}</strong> of{' '}
            <strong className="text-white">{vehicles.length}</strong> cars
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-surface mt-8 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setPageLimit(6);
                  }}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-gold-dark via-gold to-gold-light text-navy-dark shadow-md shadow-gold/20'
                      : 'border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Debounced Search & Sort */}
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search model, color..."
                  className="liquid-glass-input w-full rounded-xl py-2 pr-3 pl-9 text-xs text-white placeholder:text-white/40 outline-none"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="liquid-glass-input rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none"
              >
                <option value="recommended" className="bg-navy-dark text-white">Recommended</option>
                <option value="price-asc" className="bg-navy-dark text-white">Price: Low to High</option>
                <option value="price-desc" className="bg-navy-dark text-white">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicle Cards Grid with Skeleton Support */}
        {isPending ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="liquid-card overflow-hidden rounded-2xl">
                <div className="skeleton-shimmer h-48 w-full" />
                <div className="space-y-3 p-5">
                  <div className="skeleton-shimmer h-5 w-3/4 rounded-lg" />
                  <div className="skeleton-shimmer h-4 w-1/2 rounded-lg" />
                  <div className="skeleton-shimmer mt-4 h-8 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleVehicles.length === 0 ? (
          <div className="glass-surface mt-12 rounded-3xl p-12 text-center">
            <Car size={40} className="mx-auto text-white/30" />
            <h3 className="mt-4 text-lg font-bold text-white">No vehicles found</h3>
            <p className="mt-1 text-xs text-white/60">Try clearing your search query or choosing another category.</p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchInput('');
              }}
              className="btn-gold mt-4 py-1.5 text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleVehicles.map((car) => {
              const photo = car.cardPhotoId || car.photoId;
              return (
                <div
                  key={car.id}
                  className="liquid-card group flex flex-col justify-between overflow-hidden rounded-2xl"
                >
                  <div>
                    {/* Vehicle Photo Container */}
                    <div className="relative h-48 w-full overflow-hidden bg-navy-dark/60">
                      {photo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={`/api/files/${photo}`}
                          alt={car.model}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-white/40">
                          <Car size={48} className="opacity-40" />
                          <span className="mt-2 text-xs font-semibold tracking-wider uppercase text-white/50">
                            {car.model}
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
                        <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-white backdrop-blur-md">
                          {car.category}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 backdrop-blur-md">
                          <CheckCircle2 size={11} /> Instant Confirm
                        </span>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-gold-light transition-colors">
                            {car.model}
                          </h3>
                          <p className="mt-0.5 text-xs text-white/60">
                            {car.color ? `${car.color} · ` : ''}Reg: {car.regNo}
                          </p>
                        </div>
                      </div>

                      {/* Specs Icons */}
                      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/10 py-3 text-center text-[11px] text-white/70">
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-white/40">Duration</span>
                          <span className="font-bold text-white">24h / 12h</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-white/40">Security</span>
                          <span className="font-bold text-emerald-400">Insured</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-white/40">Tracking</span>
                          <span className="font-bold text-white">GPS Live</span>
                        </div>
                      </div>

                      {/* Pricing Grid */}
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-xl font-extrabold text-gold">
                            {pkr(car.rateDay)}
                            <span className="text-xs font-normal text-white/60"> / 24h day</span>
                          </p>
                          <p className="text-[11px] text-white/60">
                            {pkr(car.rate12h)} for 12 hours
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking CTA Button */}
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => handleOpenBooking(car)}
                      className="btn-gold flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold/20 hover:brightness-110 transition"
                    >
                      <span>Inquire / Book Now</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Pagination */}
        {filteredVehicles.length > pageLimit && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setPageLimit((prev) => prev + 6)}
              className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              Load More Vehicles ({filteredVehicles.length - pageLimit} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Liquid Glass Booking & Lead Capture Modal */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md">
          <div className="glass-surface relative w-full max-w-lg rounded-3xl p-6 shadow-2xl sm:p-8">
            {/* Modal Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-5 right-5 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                <Car size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedCar.model}</h3>
                <p className="text-xs text-white/60">
                  {pkr(selectedCar.rateDay)} / day · {pkr(selectedCar.rate12h)} / 12h
                </p>
              </div>
            </div>

            {/* Success Confirmation Screen */}
            {submissionSuccess ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="mt-4 text-xl font-bold text-white">Inquiry Received!</h4>
                <p className="mt-2 text-xs text-white/70">
                  Your booking request for <strong className="text-white">{submissionSuccess.vehicleModel}</strong> has been logged in our system.
                </p>

                <div className="my-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-start text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/60">Booking Reference:</span>
                    <strong className="font-mono text-gold-light">{submissionSuccess.bookingId}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/60">Estimated Total:</span>
                    <strong className="text-emerald-400">{pkr(submissionSuccess.rentEstimate ?? 0)}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-white/60">Contact Phone:</span>
                    <span className="text-white">{submissionSuccess.phone}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  {submissionSuccess.whatsappUrl && (
                    <a
                      href={submissionSuccess.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gold flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-lg shadow-gold/20"
                    >
                      <MessageCircle size={15} />
                      <span>Instant Confirm on WhatsApp</span>
                    </a>
                  )}
                  <Link
                    href={`/portal/my`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
                  >
                    <span>Track on Customer Portal</span>
                    <ExternalLink size={13} />
                  </Link>
                  <button
                    onClick={handleCloseModal}
                    className="mt-2 text-xs text-white/50 hover:text-white"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Inquiry Form */
              <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
                {submissionError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs text-rose-300">
                    {submissionError}
                  </div>
                )}

                {/* Pickup & Return Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Pick-up Date
                    </label>
                    <input
                      type="datetime-local"
                      name="start"
                      value={bookingStart}
                      onChange={(e) => setBookingStart(e.target.value)}
                      required
                      className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Return Date
                    </label>
                    <input
                      type="datetime-local"
                      name="end"
                      value={bookingEnd}
                      onChange={(e) => setBookingEnd(e.target.value)}
                      required
                      className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* Rental Type & Service Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Duration Type
                    </label>
                    <select
                      name="durationType"
                      value={durationType}
                      onChange={(e) => setDurationType(e.target.value as any)}
                      className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="DAY" className="bg-navy-dark text-white">Full Day (24 Hours)</option>
                      <option value="12H" className="bg-navy-dark text-white">Shift (12 Hours)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Driver Preference
                    </label>
                    <select
                      name="bookingType"
                      value={bookingType}
                      onChange={(e) => setBookingType(e.target.value)}
                      className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="Self-drive" className="bg-navy-dark text-white">Self-drive</option>
                      <option value="With driver" className="bg-navy-dark text-white">With Chauffeur</option>
                    </select>
                  </div>
                </div>

                {/* Customer Details */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Muhammad Farhan"
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
                      CNIC Number (13 Digits)
                    </label>
                    <input
                      type="text"
                      name="cnic"
                      required
                      placeholder="35202-1234567-1"
                      className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Delivery / Pickup Hub
                  </label>
                  <select
                    name="city"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Islamabad" className="bg-navy-dark text-white">Islamabad / Rawalpindi Hub</option>
                    <option value="Islamabad Airport" className="bg-navy-dark text-white">Islamabad Intl Airport (ISB)</option>
                    <option value="Lahore" className="bg-navy-dark text-white">Lahore (DHA / Airport)</option>
                    <option value="Karachi" className="bg-navy-dark text-white">Karachi (Clifton / Airport)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Special Requests / Flight Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Flight PK-302 arrival at 4 PM, child seat needed"
                    className="liquid-glass-input w-full rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none"
                  />
                </div>

                <p className="text-[11px] text-white/50">
                  ⚡ Zero pre-payment required. Your reservation request lands directly into our fleet system and our office will call or message to confirm within 15 minutes.
                </p>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-gold flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold/25 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Submitting Inquiry...</span>
                    ) : (
                      <>
                        <span>Submit Booking Request</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
