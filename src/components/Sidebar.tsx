'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { trapTab } from '@/components/client';
import * as Icons from 'lucide-react';
import { MODULES } from '@/lib/modules';
import { BrandMark } from '@/components/BrandMark';

type Props = { allowed: string[]; labels: Record<string, string>; business: string };
const GROUPS = ['overview', 'operations', 'people', 'finance', 'system'] as const;
const ICON = { size: 18, strokeWidth: 1.5 } as const;

export default function Sidebar({ allowed, labels, business }: Props) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const active = (h: string) => (h === '/admin' ? path === '/admin' : path.startsWith(h));

  useEffect(() => setMobile(false), [path]);
  // Remember the collapsed rail between visits (per browser).
  useEffect(() => {
    try { setCollapsed(localStorage.getItem('sm:sidebar') === 'collapsed'); } catch { /* storage blocked: keep default */ }
  }, []);
  const toggleCollapsed = () => setCollapsed((c) => {
    const next = !c;
    try { localStorage.setItem('sm:sidebar', next ? 'collapsed' : 'open'); } catch { /* ignore */ }
    return next;
  });
  // Mobile drawer: focus moves in on open, Tab stays inside, focus returns to the menu button on close.
  useEffect(() => {
    if (!mobile) return;
    const btn = menuBtn.current;
    drawer.current?.querySelector<HTMLElement>('a[href]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMobile(false); return; }
      trapTab(e, drawer.current);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); btn?.focus(); };
  }, [mobile]);

  const renderNav = (collapsed: boolean) => (
    <nav aria-label="Modules" className="flex-1 overflow-y-auto px-3 pb-4 pt-4">
      {GROUPS.map((g, gi) => {
        const items = MODULES.filter((m) => m.group === g && allowed.includes(m.key));
        if (!items.length) return null;
        return (
          <div key={g} className={gi === 0 ? '' : 'mt-5'}>
            {!collapsed && g !== 'overview' && <p className="mb-1.5 px-3 text-xs font-medium text-white/60">{labels[g]}</p>}
            <div className="space-y-0.5">
              {items.map((m) => {
                const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[m.icon] ?? Icons.Circle;
                const on = active(m.href);
                return (
                  <Link
                    key={m.key}
                    href={m.href}
                    title={collapsed ? labels[m.key] : undefined}
                    aria-label={collapsed ? labels[m.key] : undefined}
                    aria-current={on ? 'page' : undefined}
                    className={`relative flex h-8 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors duration-150 ${
                      collapsed ? 'justify-center px-0' : ''
                    } ${on ? 'bg-white/[0.12] font-semibold text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                  >
                    {on && <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-gold" aria-hidden />}
                    <Icon {...ICON} aria-hidden className={`shrink-0 ${on ? 'text-gold' : 'text-white/50'}`} />
                    {!collapsed && <span className="truncate">{labels[m.key]}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  const renderBody = (collapsed: boolean, inDrawer = false) => (
    <div className={`flex h-full flex-col bg-navy-dark text-white transition-[width] duration-200 ease-out ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className={`flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4 ${collapsed ? 'justify-center px-0' : ''}`}>
        <Link href="/admin" aria-label={business} className="min-w-0">
          {collapsed ? <BrandMark name="" size={32} tone="white" /> : <BrandMark name={business} caption={labels.adminPanel} size={32} tone="white" />}
        </Link>
      </div>
      {renderNav(collapsed)}
      <div className="space-y-0.5 border-t border-white/10 p-2">
        <Link href="/portal" target="_blank" rel="noopener noreferrer" aria-label={`${labels.switchToCustomer} (opens in a new tab)`} className={`flex h-8 items-center gap-2.5 rounded-lg px-3 text-sm text-white/70 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white ${collapsed ? 'justify-center px-0' : ''}`}>
          <Icons.ExternalLink {...ICON} className="shrink-0 text-white/50" />
          {!collapsed && labels.switchToCustomer}
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="Collapse sidebar"
          aria-expanded={!collapsed}
          className={`${inDrawer ? 'hidden' : 'hidden lg:flex'} h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-white/70 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white ${collapsed ? 'justify-center px-0' : ''}`}
        >
          {collapsed ? <Icons.PanelLeftOpen {...ICON} className="text-white/50" /> : <Icons.PanelLeftClose {...ICON} className="text-white/50" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={menuBtn}
        type="button"
        onClick={() => setMobile(true)}
        aria-expanded={mobile}
        aria-controls="mobile-nav"
        className="no-print fixed start-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white lg:hidden"
        aria-label="Open menu"
      >
        <Icons.Menu size={20} strokeWidth={1.5} />
      </button>
      <aside data-surface="dark" className="no-print sticky top-0 hidden h-screen shrink-0 lg:block">{renderBody(collapsed)}</aside>
      {mobile && (
        <div id="mobile-nav" className="no-print fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" onClick={() => setMobile(false)}>
          <div ref={drawer} data-surface="dark" onClick={(e) => e.stopPropagation()} className="relative h-full shadow-modal">
            {/* The drawer always shows full labels, even if the desktop rail is collapsed. */}
            {renderBody(false, true)}
            <button type="button" onClick={() => setMobile(false)} aria-label="Close menu" className="absolute end-2 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white">
              <Icons.X size={20} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 bg-ink/30" />
        </div>
      )}
    </>
  );
}
