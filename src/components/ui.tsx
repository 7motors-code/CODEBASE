import Link from 'next/link';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="no-print flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  gold: 'from-gold/20 to-transparent text-gold', blue: 'from-sky-500/20 to-transparent text-sky-400',
  green: 'from-emerald-500/20 to-transparent text-emerald-400', red: 'from-rose-500/20 to-transparent text-rose-400',
  purple: 'from-violet-500/20 to-transparent text-violet-400', orange: 'from-orange-500/20 to-transparent text-orange-400',
  cyan: 'from-cyan-500/20 to-transparent text-cyan-400', yellow: 'from-yellow-400/25 to-transparent text-yellow-500',
};
export function Kpi({ label, value, hint, tone = 'gold', icon }: { label: string; value: ReactNode; hint?: ReactNode; tone?: keyof typeof TONES | string; icon?: ReactNode }) {
  return (
    <div className={`card relative overflow-hidden bg-gradient-to-br p-4 ${TONES[tone] ?? TONES.gold}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {icon && <span className="opacity-80">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-ink">{value}</p>
      {hint && <div className="mt-1 text-xs">{hint}</div>}
    </div>
  );
}

const BADGE: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500/15 text-emerald-400', ACTIVE: 'bg-emerald-500/15 text-emerald-400', COMPLETED: 'bg-emerald-500/15 text-emerald-400',
  PAID: 'bg-emerald-500/15 text-emerald-400', DONE: 'bg-emerald-500/15 text-emerald-400',
  BOOKED: 'bg-rose-500/15 text-rose-400', RENTED: 'bg-rose-500/15 text-rose-400', OVERDUE: 'bg-rose-600/20 text-rose-400', BLOCKED: 'bg-rose-500/15 text-rose-400',
  CANCELLED: 'bg-slate-500/20 text-slate-400', INACTIVE: 'bg-slate-500/20 text-slate-400', WAIVED: 'bg-slate-500/20 text-slate-400',
  RETURN: 'bg-violet-500/15 text-violet-400', RESERVED: 'bg-sky-500/15 text-sky-400', CONFIRMED: 'bg-sky-500/15 text-sky-400',
  IN_PROGRESS: 'bg-orange-500/15 text-orange-400', MAINTENANCE: 'bg-yellow-500/15 text-yellow-500', SCHEDULED: 'bg-cyan-500/15 text-cyan-400',
  PENDING: 'bg-amber-500/15 text-amber-400', OPEN: 'bg-amber-500/15 text-amber-400',
  HIGH: 'bg-rose-500/15 text-rose-400', MEDIUM: 'bg-amber-500/15 text-amber-400', LOW: 'bg-slate-500/20 text-slate-400',
};
const LABEL: Record<string, string> = { IN_PROGRESS: 'In Progress', BOOKED: 'Rented', PER_BOOKING: 'Per Booking', SALARY: 'Salary Basis' };
export function Badge({ status, label }: { status: string; label?: string }) {
  const txt = label ?? LABEL[status] ?? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
  return <span className={`badge ${BADGE[status] ?? 'bg-gold/15 text-gold'}`}>{txt}</span>;
}

export function Modal({ title, closeHref, children, wide }: { title: string; closeHref: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm md:p-10">
      <div className={`card w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <Link href={closeHref} scroll={false} className="rounded-lg p-1 text-muted hover:bg-panel2 hover:text-ink" aria-label="Close"><X size={20} /></Link>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, required, className = '' }: { label: string; children: ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}{required && <span className="text-rose-400"> *</span>}</span>
      {children}
    </label>
  );
}

export function Card({ title, children, actions, className = '' }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <h2 className="section-title">{title}</h2>
          {actions && <div className="no-print flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Empty({ cols, text = 'No records found' }: { cols: number; text?: string }) {
  return <tr><td colSpan={cols} className="py-10 text-center text-muted">{text}</td></tr>;
}

/** Simple GET search/filter bar; keeps other params via hidden fields */
export function SearchBar({ placeholder, q, children, keep }: { placeholder: string; q?: string; children?: ReactNode; keep?: Record<string, string | undefined> }) {
  return (
    <form className="no-print flex flex-wrap items-center gap-2 p-4" method="get">
      {keep && Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <input name="q" defaultValue={q} placeholder={placeholder} className="input max-w-sm flex-1" />
      {children}
      <button className="btn-ghost">Search</button>
    </form>
  );
}

export function Pagination({ page, pages, total, per, makeHref }: { page: number; pages: number; total: number; per: number; makeHref: (p: number) => string }) {
  const from = total === 0 ? 0 : (page - 1) * per + 1;
  const to = Math.min(total, page * per);
  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-muted">
      <span>Showing {from} to {to} of {total} entries</span>
      <div className="flex items-center gap-1">
        <Link className={`btn-ghost btn-sm ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`} href={makeHref(page - 1)}>Previous</Link>
        {Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map((p) => (
          <Link key={p} href={makeHref(p)} className={`btn-sm btn ${p === page ? 'bg-gold text-navy-dark' : 'btn-ghost'}`}>{p}</Link>
        ))}
        <Link className={`btn-ghost btn-sm ${page >= pages ? 'pointer-events-none opacity-40' : ''}`} href={makeHref(page + 1)}>Next</Link>
      </div>
    </div>
  );
}

export function paginate<T>(rows: T[], pageParam: string | undefined, per = 15) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / per));
  const page = Math.min(pages, Math.max(1, parseInt(pageParam ?? '1', 10) || 1));
  return { slice: rows.slice((page - 1) * per, page * per), page, pages, total, per };
}

/** Build a URL keeping existing search params and overriding some */
export function href(base: string, params: Record<string, string | number | undefined | null>, over: Record<string, string | number | undefined | null> = {}) {
  const u = new URLSearchParams();
  Object.entries({ ...params, ...over }).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') u.set(k, String(v)); });
  const s = u.toString();
  return s ? `${base}?${s}` : base;
}

export function Thumb({ id, alt, size = 44 }: { id?: string | null; alt: string; size?: number }) {
  if (!id) return <div style={{ width: size, height: size }} className="flex items-center justify-center rounded-lg bg-panel2 text-[10px] text-muted">No photo</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/api/files/${id}`} alt={alt} style={{ width: size, height: size }} className="rounded-lg object-cover" />;
}

export function Avatar({ name }: { name: string }) {
  return <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-xs font-bold uppercase text-navy-dark">{name.trim().charAt(0) || '?'}</span>;
}
