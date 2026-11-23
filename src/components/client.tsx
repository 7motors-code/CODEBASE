'use client';
import { useFormStatus } from 'react-dom';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab / Shift+Tab cycling inside `box`. Returns true when it handled the key. */
export function trapTab(e: KeyboardEvent, box: HTMLElement | null): boolean {
  if (e.key !== 'Tab' || !box) return false;
  const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
  if (items.length === 0) return false;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !box.contains(active))) { e.preventDefault(); last.focus(); return true; }
  if (!e.shiftKey && (active === last || !box.contains(active))) { e.preventDefault(); first.focus(); return true; }
  return false;
}

function Spinner() {
  return <span aria-hidden className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-e-transparent" />;
}

export function Submit({ children, className = 'btn-primary', pendingText = 'Saving…', name, value }: { children: ReactNode; className?: string; pendingText?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} className={className} disabled={pending} aria-busy={pending}>
      {pending ? <><Spinner />{pendingText}</> : children}
    </button>
  );
}

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-danger btn-sm" disabled={pending} data-confirm-submit>
      {pending ? <><Spinner />Working…</> : label}
    </button>
  );
}

/**
 * A form button that asks for confirmation in a small popover next to it
 * (no browser dialog). Escape or a click outside cancels.
 */
export function ConfirmForm({ action, message, children, className = 'btn-ghost btn-sm', hidden, confirmLabel = 'Confirm', ariaLabel }: { action: (fd: FormData) => void | Promise<void>; message: string; children: ReactNode; className?: string; hidden?: Record<string, string | number>; confirmLabel?: string; /** Required when the trigger shows only an icon. */ ariaLabel?: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const open = pos !== null;
  const wrap = useRef<HTMLFormElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const POPOVER_W = 256;

  const toggle = () => {
    if (open) { setPos(null); return; }
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    // Fixed position so table scroll containers never clip it; flip above when near the bottom.
    const below = r.bottom + 8;
    const top = below + 120 > window.innerHeight ? Math.max(8, r.top - 128) : below;
    const left = Math.min(Math.max(8, r.right - POPOVER_W), window.innerWidth - POPOVER_W - 8);
    setPos({ top, left });
  };

  // Closing by Keep or Escape hands focus back to the trigger instead of dropping it.
  const cancel = () => { setPos(null); trigger.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    // Start on the safe choice, not the destructive one.
    wrap.current?.querySelector<HTMLButtonElement>('[data-keep]')?.focus();
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); trigger.current?.focus(); } };
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) close(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <form ref={wrap} action={async (fd) => { try { await action(fd); } finally { setPos(null); } }} className="relative inline-block">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={String(v)} />)}
      <button ref={trigger} type="button" className={className} aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={toggle}>{children}</button>
      {pos && (
        <div id={id} role="alertdialog" aria-label={message} style={{ top: pos.top, left: pos.left, width: POPOVER_W }}
          className="reveal fixed z-[60] rounded-xl border border-line bg-panel p-3 text-start shadow-float">
          <p className="whitespace-normal text-[13px] leading-snug text-ink">{message}</p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" data-keep className="btn-quiet btn-sm" onClick={cancel}>Keep</button>
            <ConfirmButton label={confirmLabel} />
          </div>
        </div>
      )}
    </form>
  );
}

export function ImageInput({ name, label, required, current, multiple, accept = 'image/*' }: { name: string; label: string; required?: boolean; current?: string | null; multiple?: boolean; accept?: string }) {
  const [previews, setPreviews] = useState<string[]>(current ? [`/api/files/${current}`] : []);
  return (
    <label className="block">
      <span className="label">{label}{required && <span className="text-bad" aria-hidden> *</span>}</span>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-panel2 p-3">
        <div className="flex flex-wrap gap-2">
          {previews.length ? previews.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt="" className="h-14 w-14 rounded-lg object-cover" />
          )) : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-panel text-[11px] text-muted">Preview</div>}
        </div>
        <input type="file" name={name} accept={accept} multiple={multiple} required={required && !current} aria-required={required || undefined}
          className="text-xs text-muted file:me-3 file:rounded-md file:border file:border-line file:bg-panel file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink hover:file:bg-panel2"
          onChange={(e) => setPreviews(Array.from(e.target.files ?? []).map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : '')).filter(Boolean))} />
      </div>
    </label>
  );
}

export function SignaturePad({ name }: { name: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState('');
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext('2d')!;
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#0B2A5B';
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  }, []);
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return { x: ((e.clientX - r.left) * ref.current!.width) / r.width, y: ((e.clientY - r.top) * ref.current!.height) / r.height }; };
  return (
    <div>
      <canvas ref={ref} width={500} height={150} role="img" aria-label="Signature drawing area. Keyboard users can upload a signature image instead." className="w-full touch-none rounded-xl border border-line bg-white"
        onPointerDown={(e) => { drawing.current = true; const p = pos(e); const ctx = ref.current!.getContext('2d')!; ctx.beginPath(); ctx.moveTo(p.x, p.y); }}
        onPointerMove={(e) => { if (!drawing.current) return; const p = pos(e); const ctx = ref.current!.getContext('2d')!; ctx.lineTo(p.x, p.y); ctx.stroke(); }}
        onPointerUp={() => { drawing.current = false; setData(ref.current!.toDataURL('image/png')); }}
        onPointerLeave={() => { if (drawing.current) { drawing.current = false; setData(ref.current!.toDataURL('image/png')); } }} />
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>Customer signs here with finger or mouse</span>
        <button type="button" className="link" onClick={() => { const c = ref.current!; const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); setData(''); }}>Clear</button>
      </div>
      <input type="hidden" name={name} value={data} />
    </div>
  );
}

export function PrintButton({ label = 'Print', auto }: { label?: string; auto?: boolean }) {
  // Auto-print waits for every image (CNIC, signature, logo) so the paper is complete,
  // and is cancelled if the user leaves the page first.
  useEffect(() => {
    if (!auto) return;
    let cancelled = false;
    Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => undefined)))
      .then(() => { if (!cancelled) window.print(); });
    return () => { cancelled = true; };
  }, [auto]);
  return <button type="button" className="btn-primary no-print" onClick={() => window.print()}>{label}</button>;
}

/** Collapsible panel (used on dashboard / forms) */
export function Toggle({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div><button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(!open)}>{label}</button>{open && <div className="mt-3">{children}</div>}</div>;
}

/**
 * Behaviour for the server-rendered <Modal>: Escape returns to `closeHref`,
 * the page behind stops scrolling, and focus starts on the first field.
 */
export function ModalBehavior({ closeHref, containerId }: { closeHref: string; containerId: string }) {
  const router = useRouter();
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const opener = document.activeElement as HTMLElement | null;
    const box = document.getElementById(containerId);
    const first = box?.querySelector<HTMLElement>('input:not([type=hidden]):not([disabled]), select, textarea');
    (first ?? box)?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role=alertdialog]')) return; // let an open confirm handle keys first
      if (trapTab(e, box)) return;
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      router.push(closeHref, { scroll: false });
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      // Return focus to whatever opened the modal, if it is still on the page.
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [closeHref, containerId, router]);
  return null;
}

/** Closes any open <details data-dropdown> when clicking outside it or pressing Escape. */
export function DropdownCloser() {
  useEffect(() => {
    const closeAll = (except?: Node) => document.querySelectorAll<HTMLDetailsElement>('details[data-dropdown][open]').forEach((d) => {
      if (!except || !d.contains(except)) d.open = false;
    });
    const onDown = (e: MouseEvent) => closeAll(e.target as Node);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector<HTMLDetailsElement>('details[data-dropdown][open]');
      const hadFocus = open?.contains(document.activeElement);
      closeAll();
      if (hadFocus) open?.querySelector<HTMLElement>('summary')?.focus();
    };
    // Following a link inside a dropdown closes it (the layout persists across navigation).
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('details[data-dropdown] a');
      if (link) closeAll();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);
  return null;
}
