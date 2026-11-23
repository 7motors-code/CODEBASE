// Pakistan Standard Time is a fixed UTC+05:00 offset (no daylight saving).
export const TZ = 'Asia/Karachi';
const OFFSET_MS = 5 * 3600 * 1000;

export function pkr(n: number | null | undefined) {
  const v = Math.round(Number(n ?? 0));
  return `PKR ${v < 0 ? '-' : ''}${Math.abs(v).toLocaleString('en-US')}`;
}

/** dd/mm/yyyy in Pakistan time */
export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '—';
  const x = typeof d === 'string' && d.length === 10 ? new Date(d + 'T00:00:00+05:00') : new Date(d);
  return x.toLocaleDateString('en-GB', { timeZone: TZ });
}
export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}
export function fmtTime(d: Date | string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true });
}

/** Parse "YYYY-MM-DDTHH:mm" (datetime-local) or "YYYY-MM-DD" as Pakistan time */
export function parsePk(s: string | null | undefined): Date | null {
  if (!s) return null;
  // Impossible dates like 2026-13-45 produce an Invalid Date, which is truthy; reject them here.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00+05:00`)
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? new Date(`${s}:00+05:00`)
    : new Date(s);
  return isNaN(+d) ? null : d;
}

/** Pakistan-local parts of a date */
export function pkParts(d: Date = new Date()) {
  const x = new Date(d.getTime() + OFFSET_MS);
  return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate(), h: x.getUTCHours(), min: x.getUTCMinutes() };
}
const p2 = (n: number) => String(n).padStart(2, '0');
/** YYYY-MM-DD in Pakistan time */
export function pkDay(d: Date = new Date()) { const p = pkParts(d); return `${p.y}-${p2(p.m)}-${p2(p.d)}`; }
/** YYYY-MM-DDTHH:mm in Pakistan time (for datetime-local inputs) */
export function pkInput(d: Date = new Date()) { const p = pkParts(d); return `${p.y}-${p2(p.m)}-${p2(p.d)}T${p2(p.h)}:${p2(p.min)}`; }
/** YYYY-MM in Pakistan time */
export function pkMonth(d: Date = new Date()) { const p = pkParts(d); return `${p.y}-${p2(p.m)}`; }

/** Start and end (exclusive) of a Pakistan day */
export function dayRange(day: string) {
  const start = new Date(`${day}T00:00:00+05:00`);
  return { start, end: new Date(start.getTime() + 86400000) };
}
/** Start and end (exclusive) of a Pakistan month "YYYY-MM" */
export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(`${y}-${p2(m)}-01T00:00:00+05:00`);
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
  return { start, end: new Date(`${ny}-${p2(nm)}-01T00:00:00+05:00`) };
}
export function addMonths(month: string, n: number) {
  const [y, m] = month.split('-').map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${p2((t % 12) + 1)}`;
}
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function monthLabel(month: string) { const [y, m] = month.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; }

export function int(v: FormDataEntryValue | null | undefined, def = 0) {
  const n = parseInt(String(v ?? '').replace(/[, ]/g, ''), 10);
  return isNaN(n) ? def : n;
}
export function str(v: FormDataEntryValue | null | undefined) {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}

/** Upper bound for any single rupee amount; stops typos overflowing int columns. */
export const MONEY_MAX = 100_000_000;
/** Whole rupees, never negative, never absurd. Use for every price, fee, fine or cost. */
export function money(v: FormDataEntryValue | null | undefined, def = 0) {
  return Math.min(MONEY_MAX, Math.max(0, int(v, def)));
}
/** Trimmed text clipped to `max` characters, or null when empty. */
export function clipStr(v: FormDataEntryValue | null | undefined, max: number) {
  const s = str(v);
  return s === null ? null : s.slice(0, max);
}
/** A YYYY-MM-DD day string, or `def` when the value is anything else. */
export function isoDay(v: FormDataEntryValue | null | undefined, def: string) {
  const s = String(v ?? '').trim();
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s) ? s : def;
}
/** A YYYY-MM month string, or null. */
export function isoMonth(v: FormDataEntryValue | null | undefined) {
  const s = String(v ?? '').trim();
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s) ? s : null;
}
/** Payment methods offered across the admin forms. */
export const PAY_METHODS = ['Cash', 'Bank transfer', 'JazzCash', 'Easypaisa', 'Card', 'Cheque'] as const;
