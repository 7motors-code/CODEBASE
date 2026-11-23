'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { MapPin, Pause, Play } from 'lucide-react';
import { HERO_PHOTOS } from './hero-photos';

/** How long each photo holds before the next one fades in. */
const HOLD_MS = 6500;

/**
 * Full-bleed photo slideshow behind the hero copy. Photos drift slowly
 * (Ken Burns) and crossfade; a frosted layer blurs the side the text sits on
 * so the headline stays readable while the car on the other side stays sharp.
 */
export function HeroBackdrop() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const photo = HERO_PHOTOS[index];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % HERO_PHOTOS.length), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [index, paused]);

  const show = useCallback((i: number) => setIndex(i), []);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden bg-navy-dark" aria-hidden>
        {HERO_PHOTOS.map((p, i) => {
          const on = i === index;
          return (
            <div
              key={p.src}
              className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${on ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={p.src}
                alt=""
                fill
                priority={i === 0}
                quality={72}
                sizes="100vw"
                style={{ objectPosition: p.focus }}
                className={`object-cover ${on ? 'hero-drift' : ''}`}
              />
            </div>
          );
        })}

        {/* Navy scrim: heavy behind the copy, light over the car */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/70 to-navy-dark/30 lg:bg-gradient-to-r lg:from-navy-dark/90 lg:via-navy-dark/50 lg:to-navy-dark/5" />
        {/* Frosted glass on the text side only */}
        <div className="hero-frost absolute inset-0 backdrop-blur-[6px]" />
        {/* Fade into the booking widget */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy-dark/90 to-transparent" />
      </div>

      {/* Caption + controls */}
      <div className="absolute bottom-28 end-4 z-10 hidden items-center gap-4 sm:end-6 md:bottom-32 md:flex lg:end-8">
        <p className="text-end text-[13px] leading-tight text-white/80" aria-live="polite">
          <span className="inline-flex items-center gap-1.5 text-white">
            <MapPin size={14} strokeWidth={1.75} className="text-gold" aria-hidden />
            {photo.place}
          </span>
          <span className="mt-1 block text-xs text-white/55">Photo · {photo.credit}</span>
        </p>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Background photos">
          {HERO_PHOTOS.map((p, i) => (
            <button
              key={p.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Photo ${i + 1}: ${p.place}`}
              onClick={() => show(i)}
              className="group relative h-6 w-7 rounded"
            >
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/45">
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className={`absolute inset-y-0 start-0 rounded-full bg-gold ${paused ? 'w-full' : 'hero-progress'}`}
                    style={{ animationDuration: `${HOLD_MS}ms` }}
                  />
                )}
                {i < index && <span className="absolute inset-0 rounded-full bg-white/70" />}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/85 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          {paused ? <Play size={14} strokeWidth={2} /> : <Pause size={14} strokeWidth={2} />}
        </button>
      </div>
    </>
  );
}
