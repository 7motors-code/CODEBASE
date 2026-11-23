import Link from 'next/link';
import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { ModalBehavior } from './client';

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[30px] font-bold leading-tight tracking-[-0.025em] text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink2">{subtitle}</p>}
      </div>
      {children && <div className="no-print flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/**
 * A stat: label, one figure, and what it compares to. `featured` draws the
 * page's headline number on a dark navy card. `tone`/`icon` are accepted for
 * compatibility but not drawn.
 */
export function Kpi({ label, value, hint, featured }: { label: string; value: ReactNode; hint?: ReactNode; tone?: string; icon?: ReactNode; featured?: boolean }) {
  if (featured) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-navy-dark px-5 py-4 text-white shadow-float">
        <span className="absolute inset-y-0 start-0 w-1 bg-gold" aria-hidden />
        <p className="text-[13px] font-medium text-white/70">{label}</p>
        <p className="mt-2 font-mono text-[28px] font-semibold leading-none tabular-nums tracking-[-0.01em] text-gold">{value}</p>
        {hint && <div className="mt-2 text-[13px] text-white/60 [&_.text-ink2]:text-white/80 [&_.text-ok]:text-[#4cc38a] [&_.text-bad]:text-[#ff7b7b]">{hint}</div>}
      </div>
    );
  }
  return (
    <div className="card px-5 py-4">
      <p className="text-[13px] font-medium text-ink2">{label}</p>
      <p className="mt-2 font-mono text-[28px] font-semibold leading-none tabular-nums tracking-[-0.01em] text-ink">{value}</p>
      {hint && <div className="mt-2 text-[13px] text-muted">{hint}</div>}
    </div>
  );
}

type Tone = 'ok' | 'bad' | 'warn' | 'info' | 'neutral' | 'navy';
const TONE_CLASS: Record<Tone, { box: string; dot: string }> = {
  ok: { box: 'bg-ok-soft text-ok', dot: 'bg-ok' },
  bad: { box: 'bg-bad-soft text-bad', dot: 'bg-bad' },
  warn: { box: 'bg-warn-soft text-warn', dot: 'bg-warn' },
  info: { box: 'bg-info-soft text-info', dot: 'bg-info' },
  navy: { box: 'bg-navy-soft text-navy', dot: 'bg-navy' },
  neutral: { box: 'bg-panel2 text-ink2', dot: 'bg-muted' },
};
const STATUS_TONE: Record<string, Tone> = {
  AVAILABLE: 'ok', ACTIVE: 'ok', COMPLETED: 'ok', PAID: 'ok', DONE: 'ok',
  BOOKED: 'navy', RENTED: 'navy', RETURN: 'info', RESERVED: 'info', CONFIRMED: 'info', SCHEDULED: 'info',
  OVERDUE: 'bad', BLOCKED: 'bad', HIGH: 'bad',
  IN_PROGRESS: 'warn', MAINTENANCE: 'warn', PENDING: 'warn', OPEN: 'warn', MEDIUM: 'warn',
  CANCELLED: 'neutral', INACTIVE: 'neutral', WAIVED: 'neutral', LOW: 'neutral',
};
const LABEL: Record<string, string> = { IN_PROGRESS: 'In progress', BOOKED: 'Rented', PER_BOOKING: 'Per booking', SALARY: 'Salary' };

export function Badge({ status, label }: { status: string; label?: string }) {
  const txt = label ?? LABEL[status] ?? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
  const tone = TONE_CLASS[STATUS_TONE[status] ?? 'neutral'];
  return (
    <span className={`badge ${tone.box}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden />
      {txt}
    </span>
  );
}

/** Registration number drawn as a number plate — the product's signature detail. */
export function Plate({ reg }: { reg: string }) {
  return <span className="plate"><span>{reg}</span></span>;
}

export function Modal({ title, closeHref, children, wide }: { title: string; closeHref: string; children: ReactNode; wide?: boolean }) {
  const boxId = `modal-${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 md:p-10" role="dialog" aria-modal="true" aria-labelledby={`${boxId}-t`}>
      <ModalBehavior closeHref={closeHref} containerId={boxId} />
      <div id={boxId} tabIndex={-1} className={`reveal relative w-full rounded-2xl border border-line bg-panel shadow-modal outline-none ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <h2 id={`${boxId}-t`} className="text-[17px] font-medium text-ink">{title}</h2>
          <Link href={closeHref} scroll={false} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-panel2 hover:text-ink" aria-label="Close">
            <X size={18} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, required, className = '' }: { label: string; children: ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}{required && <span className="text-bad" aria-hidden> *</span>}</span>
      {children}
    </label>
  );
}

export function Card({ title, children, actions, className = '' }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
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

export function Empty({ cols, text = 'No records yet' }: { cols: number; text?: string }) {
  return <tr><td colSpan={cols} className="!h-auto py-14 text-center text-sm text-muted">{text}</td></tr>;
}

/** Simple GET search/filter bar; keeps other params via hidden fields */
export function SearchBar({ placeholder, q, children, keep }: { placeholder: string; q?: string; children?: ReactNode; keep?: Record<string, string | undefined> }) {
  return (
    <form className="no-print flex flex-wrap items-center gap-2 border-b border-line p-4" method="get">
      {keep && Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label className="relative min-w-[12rem] max-w-sm flex-1">
        <span className="sr-only">Search</span>
        <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
        <input name="q" type="search" defaultValue={q} placeholder={placeholder.replace(/[.…]+$/, '')} className="input ps-9" />
      </label>
      {children}
      <button className="btn-ghost">Search</button>
    </form>
  );
}

export function Pagination({ page, pages, total, per, makeHref }: { page: number; pages: number; total: number; per: number; makeHref: (p: number) => string }) {
  const from = total === 0 ? 0 : (page - 1) * per + 1;
  const to = Math.min(total, page * per);
  const nums = Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2);
  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted">
      <span><span className="font-mono tabular-nums text-ink2">{from}–{to}</span> of <span className="font-mono tabular-nums text-ink2">{total}</span></span>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        {page <= 1
          ? <span aria-disabled="true" className="btn-quiet btn-sm opacity-40">Previous</span>
          : <Link className="btn-quiet btn-sm" href={makeHref(page - 1)}>Previous</Link>}
        {nums.map((p) => (
          <Link key={p} href={makeHref(p)} aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined}
            className={`btn-sm btn w-8 px-0 font-mono tabular-nums ${p === page ? 'bg-panel text-ink shadow-xs ring-1 ring-line' : 'text-ink2 hover:bg-panel2'}`}>{p}</Link>
        ))}
        {page >= pages
          ? <span aria-disabled="true" className="btn-quiet btn-sm opacity-40">Next</span>
          : <Link className="btn-quiet btn-sm" href={makeHref(page + 1)}>Next</Link>}
      </nav>
    </div>
  );
}

/**
 * Page maths for lists paged in SQL: clamps the page to 1..pages and returns the
 * offset to pass to `.limit(per).offset(offset)`.
 */
export function pageWindow(total: number, pageParam: string | undefined, per = 15) {
  const pages = Math.max(1, Math.ceil(total / per));
  const page = Math.min(pages, Math.max(1, parseInt(pageParam ?? '1', 10) || 1));
  return { page, pages, total, per, offset: (page - 1) * per };
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
  if (!id) return <div style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-lg border border-line bg-panel2 text-[11px] text-muted">No photo</div>;
  const src = id.startsWith('/') ? id : `/api/files/${id}`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} style={{ width: size, height: size }} className="shrink-0 rounded-lg object-cover ring-1 ring-line" />;
}

export function Avatar({ name }: { name: string }) {
  return <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel2 text-[13px] font-medium text-ink2 ring-1 ring-line">{name.trim().charAt(0).toUpperCase() || '?'}</span>;
}
