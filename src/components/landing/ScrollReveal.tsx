'use client';

import { useEffect } from 'react';

/**
 * Fades sections in as they scroll into view. Marks <html> with
 * `reveal-ready` first, so without JavaScript nothing is ever hidden.
 * Any element with `data-reveal` takes part; `--d` sets a stagger delay.
 */
export function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    const watch = (el: Element) => { if (!el.classList.contains('is-in')) io.observe(el); };
    document.querySelectorAll('[data-reveal]').forEach(watch);

    // Cards added later (filters, "Show more") join in as they mount.
    const mo = new MutationObserver((records) => {
      records.forEach((r) => r.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return;
        if (n.hasAttribute('data-reveal')) watch(n);
        n.querySelectorAll('[data-reveal]').forEach(watch);
      }));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    root.classList.add('reveal-ready');

    return () => { io.disconnect(); mo.disconnect(); root.classList.remove('reveal-ready'); };
  }, []);

  return null;
}
