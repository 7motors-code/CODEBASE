'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pkr } from '@/lib/format';
import { CAR_CLASSES, type ClassStats } from './car-classes';
import { CLASS_EVENT } from './options';

interface Slide { classIndex: number; src: string; alt: string }

/** Studio photos grouped by car class, with live rates from the fleet. */
export function Showroom({ stats }: { stats: ClassStats }) {
  const slides = useMemo<Slide[]>(
    () => CAR_CLASSES.flatMap((c, classIndex) => c.photos.map((p) => ({ classIndex, ...p }))),
    [],
  );
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const cls = CAR_CLASSES[slide.classIndex];
  const stat = stats[cls.category] ?? { count: 0, fromDay: null };

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length), [slides.length]);

  // Warm the cache for the other photos so switching never shows a blank frame.
  useEffect(() => {
    slides.forEach((s) => { const img = new window.Image(); img.src = s.src; });
  }, [slides]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(document.dir === 'rtl' ? -1 : 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(document.dir === 'rtl' ? 1 : -1); }
  };

  const browseClass = () => {
    window.dispatchEvent(new CustomEvent<string>(CLASS_EVENT, { detail: cls.category }));
    document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div onKeyDown={onKeyDown} role="region" aria-roledescription="carousel" aria-label="Car classes">
      <div className="group relative overflow-hidden rounded-2xl bg-[#101216] shadow-modal ring-1 ring-white/10">
        <div className="relative aspect-[16/10]">
          {slides.map((s, i) => (
            <Image
              key={s.src}
              src={s.src}
              alt={i === index ? s.alt : ''}
              aria-hidden={i !== index}
              fill
              priority={i === 0}
              sizes="(max-width: 1024px) 100vw, 58vw"
              className={`object-cover transition-[opacity,transform] duration-500 ease-out ${
                i === index ? 'scale-100 opacity-100' : 'scale-[1.02] opacity-0'
              }`}
            />
          ))}
          <span className="absolute end-3 top-3 rounded-md bg-black/45 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
            Photo shows the class
          </span>
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo"
            className="absolute start-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-float transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100 sm:flex">
            <ChevronLeft size={18} strokeWidth={1.75} className="rtl:rotate-180" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next photo"
            className="absolute end-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-float transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100 sm:flex">
            <ChevronRight size={18} strokeWidth={1.75} className="rtl:rotate-180" />
          </button>
        </div>

        {/* Class card */}
        <div className="relative border-t border-white/10 bg-white p-4 sm:absolute sm:bottom-4 sm:start-4 sm:w-[320px] sm:rounded-xl sm:border sm:bg-white/95 sm:shadow-float sm:backdrop-blur" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xl font-bold tracking-[-0.01em] text-ink">{cls.label}</p>
            <span className="text-[13px] text-muted">{cls.seats}</span>
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-ink2">{cls.suits}</p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
            {stat.fromDay !== null ? (
              <div>
                <p className="font-mono text-xl font-medium tabular-nums text-ink">
                  <span className="me-1 font-sans text-[13px] font-normal text-muted">from</span>{pkr(stat.fromDay)}
                </p>
                <p className="text-xs text-muted">per day · {stat.count} {stat.count === 1 ? 'car' : 'cars'} listed</p>
              </div>
            ) : (
              <p className="text-[13px] text-ink2">Rates on request</p>
            )}
            <button type="button" onClick={browseClass} className="btn-primary btn-sm shrink-0">
              {stat.count > 0 ? `See ${cls.label}s` : 'Ask about it'}
            </button>
          </div>
        </div>
      </div>

      {/* Photo strip */}
      <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Choose a photo">
        {slides.map((s, i) => {
          const on = i === index;
          const first = i === 0 || slides[i - 1].classIndex !== s.classIndex;
          return (
            <button
              key={s.src}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={`${CAR_CLASSES[s.classIndex].label}: ${s.alt}`}
              onClick={() => setIndex(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#101216] transition-[box-shadow,opacity] duration-150 ${
                first && i > 0 ? 'ms-2' : ''
              } ${on ? 'opacity-100 ring-2 ring-gold ring-offset-2 ring-offset-bg' : 'opacity-50 hover:opacity-100'}`}
            >
              <Image src={s.src} alt="" fill sizes="80px" className="object-cover" />
              {on && <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-gold" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
