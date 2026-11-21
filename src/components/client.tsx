'use client';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Submit({ children, className = 'btn-gold', pendingText = 'Saving…', name, value }: { children: ReactNode; className?: string; pendingText?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" name={name} value={value} className={className} disabled={pending}>{pending ? pendingText : children}</button>;
}

/** A form button that asks for confirmation before submitting */
export function ConfirmForm({ action, message, children, className = 'btn-ghost btn-sm', hidden }: { action: (fd: FormData) => void | Promise<void>; message: string; children: ReactNode; className?: string; hidden?: Record<string, string | number> }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(message)) e.preventDefault(); }} className="inline">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={String(v)} />)}
      <button type="submit" className={className}>{children}</button>
    </form>
  );
}

export function ImageInput({ name, label, required, current, multiple, accept = 'image/*' }: { name: string; label: string; required?: boolean; current?: string | null; multiple?: boolean; accept?: string }) {
  const [previews, setPreviews] = useState<string[]>(current ? [`/api/files/${current}`] : []);
  return (
    <label className="block">
      <span className="label">{label}{required && <span className="text-rose-400"> *</span>}</span>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-panel2 p-3">
        <div className="flex flex-wrap gap-2">
          {previews.length ? previews.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt="" className="h-14 w-14 rounded-lg object-cover" />
          )) : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-panel text-[10px] text-muted">Preview</div>}
        </div>
        <input type="file" name={name} accept={accept} multiple={multiple} required={required && !current}
          className="text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy-dark"
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
      <canvas ref={ref} width={500} height={150} className="w-full touch-none rounded-xl border border-line bg-white"
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
  useEffect(() => { if (auto) setTimeout(() => window.print(), 400); }, [auto]);
  return <button type="button" className="btn-gold no-print" onClick={() => window.print()}>{label}</button>;
}

/** Collapsible panel (used on dashboard / forms) */
export function Toggle({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div><button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(!open)}>{label}</button>{open && <div className="mt-3">{children}</div>}</div>;
}
