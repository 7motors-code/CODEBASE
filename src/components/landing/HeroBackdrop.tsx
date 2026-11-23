'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { HERO_PHOTOS } from './hero-photos';

/** How long each photo holds before the next one fades in. */
const HOLD_MS = 6500;

/**
 * Full-bleed photo slideshow behind the hero copy. Photos drift slowly
 * (Ken Burns) and crossfade; a frosted layer blurs the side the text sits on
 * so the headline stays readable while the car on the other side stays sharp.
 * Purely decorative: no caption or controls. Visitors who ask for reduced
 * motion get the first photo, still.
 */
export function HeroBackdrop() {
  const [index, setIndex] = useState(0);
  const [still, setStill] = useState(false);
  // Only mount photos already shown plus the next one, so the four other
  // full-bleed images do not compete with the first one on load.
  const [maxSeen, setMaxSeen] = useState(0);
  const next = (index + 1) % HERO_PHOTOS.length;

  useEffect(() => { setMaxSeen((m) => Math.max(m, index)); }, [index]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setStill(true);
  }, []);

  useEffect(() => {
    if (still) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % HERO_PHOTOS.length), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [index, still]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-navy-dark" aria-hidden>
      {HERO_PHOTOS.map((p, i) => {
        const on = i === index;
        if (!on && i !== next && i > maxSeen) return null;
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
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/70 to-navy-dark/30 lg:bg-gradient-to-r rtl:lg:bg-gradient-to-l lg:from-navy-dark/90 lg:via-navy-dark/50 lg:to-navy-dark/5" />
      {/* Frosted glass on the text side only */}
      <div className="hero-frost absolute inset-0 backdrop-blur-[6px]" />
      {/* Fade into the booking widget */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy-dark/90 to-transparent" />
    </div>
  );
}
