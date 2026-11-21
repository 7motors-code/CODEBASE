'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import * as Icons from 'lucide-react';
import { MODULES } from '@/lib/modules';

type Props = { allowed: string[]; labels: Record<string, string>; business: string };
const GROUPS = ['overview', 'operations', 'people', 'finance', 'system'] as const;

export default function Sidebar({ allowed, labels, business }: Props) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const active = (h: string) => (h === '/admin' ? path === '/admin' : path.startsWith(h));
  const nav = (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
      {GROUPS.map((g) => {
        const items = MODULES.filter((m) => m.group === g && allowed.includes(m.key));
        if (!items.length) return null;
        return (
          <div key={g}>
            {!collapsed && <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">• {labels[g]}</p>}
            {items.map((m) => {
              const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[m.icon] ?? Icons.Circle;
              const on = active(m.href);
              return (
                <Link key={m.key} href={m.href} onClick={() => setMobile(false)} title={labels[m.key]}
                  className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${on ? 'bg-gradient-to-r from-gold-dark via-gold to-gold-light font-semibold text-navy-dark shadow' : 'text-white/75 hover:bg-white/5 hover:text-white'}`}>
                  <Icon size={17} />{!collapsed && <span className="truncate">{labels[m.key]}</span>}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
  const body = (
    <div className={`flex h-full flex-col bg-gradient-to-b from-navy-dark via-[#0a2149] to-navy-dark text-white ${collapsed ? 'w-[76px]' : 'w-64'} transition-all`}>
      <div className="flex items-center gap-3 px-4 py-4">
        <Image src="/logo.jpg" alt="7 Motors" width={42} height={42} className="rounded-full ring-1 ring-gold/50" />
        {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-bold">{business}</p><span className="rounded bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-gold-light">{labels.adminPanel}</span></div>}
        <button onClick={() => setCollapsed(!collapsed)} className="ms-auto hidden rounded-lg p-1 text-white/50 hover:bg-white/10 lg:block" aria-label="Collapse sidebar">
          {collapsed ? <Icons.ChevronRight size={16} /> : <Icons.ChevronLeft size={16} />}
        </button>
      </div>
      {nav}
      <Link href="/portal" target="_blank" className="m-3 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/75 hover:bg-white/5">
        <Icons.ArrowLeftRight size={17} />{!collapsed && labels.switchToCustomer}
      </Link>
    </div>
  );
  return (
    <>
      <button onClick={() => setMobile(true)} className="no-print fixed start-3 top-3 z-40 rounded-xl bg-navy p-2 text-white shadow lg:hidden" aria-label="Open menu"><Icons.Menu size={20} /></button>
      <aside className="no-print sticky top-0 hidden h-screen shrink-0 lg:block">{body}</aside>
      {mobile && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden" onClick={() => setMobile(false)}>
          <div onClick={(e) => e.stopPropagation()} className="h-full">{body}</div>
          <div className="flex-1 bg-black/50" />
        </div>
      )}
    </>
  );
}
