'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';

export interface PaletteItem {
  label: string;
  href: string;
  group: 'Go to' | 'Create';
  icon: string;
}

const ICON = { size: 16, strokeWidth: 1.5 } as const;

/** Ctrl/⌘+K: jump to any module, create a record, or search bookings, customers and cars. */
export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => setIsMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === '/' && !open && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault(); setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery(''); setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.body.style.overflow = prev; };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
    const search: PaletteItem[] = q ? [{ label: `Search for “${query.trim()}”`, href: `/admin/search?q=${encodeURIComponent(query.trim())}`, group: 'Go to', icon: 'Search' }] : [];
    return [...matched, ...search];
  }, [items, query]);

  const go = useCallback((item: PaletteItem | undefined) => {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  }, [router]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  useEffect(() => {
    document.getElementById(`cmd-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="me-auto flex h-9 w-full max-w-xs items-center gap-2.5 rounded-lg border border-white/15 bg-white/[0.07] px-3 text-sm text-white/60 transition-colors duration-150 hover:border-white/30 hover:bg-white/10 hover:text-white/85"
        aria-label="Search and jump (Ctrl K)"
      >
        <Icons.Search {...ICON} />
        <span className="flex-1 text-start">Search or jump to</span>
        <kbd className="hidden rounded border border-white/15 bg-white/10 px-1.5 font-mono text-[11px] text-white/70 sm:inline">{isMac ? '⌘' : 'Ctrl'} K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/30 p-4 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Command palette" className="reveal w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-panel shadow-modal">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Icons.Search size={18} strokeWidth={1.5} className="text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onInputKey}
                placeholder="Type a page, an action, or a name to search"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                aria-activedescendant={results[active] ? `cmd-${active}` : undefined}
                className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
              />
              <kbd className="rounded border border-line bg-panel2 px-1.5 font-mono text-[11px] text-muted">Esc</kbd>
            </div>
            <ul id="cmd-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
              {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">Nothing found</li>}
              {results.map((item, i) => {
                const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[item.icon] ?? Icons.ArrowRight;
                const showGroup = i === 0 || results[i - 1].group !== item.group;
                return (
                  <li key={`${item.group}-${item.href}`} role="presentation">
                    {showGroup && <p className="px-3 pb-1 pt-2.5 text-xs text-muted">{item.group}</p>}
                    <button
                      id={`cmd-${i}`}
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => go(item)}
                      className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm transition-colors duration-100 ${i === active ? 'bg-panel2 text-ink' : 'text-ink2'}`}
                    >
                      <Icon {...ICON} className={i === active ? 'text-navy' : 'text-muted'} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {i === active && <Icons.CornerDownLeft size={14} strokeWidth={1.5} className="text-muted" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex gap-4 border-t border-line px-4 py-2.5 text-xs text-muted">
              <span><kbd className="font-mono">↑ ↓</kbd> move</span>
              <span><kbd className="font-mono">Enter</kbd> open</span>
              <span><kbd className="font-mono">/</kbd> opens this anywhere</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
