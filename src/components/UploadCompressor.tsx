'use client';
import { useEffect } from 'react';

const MAX_SIDE = 1800;
const QUALITY = 0.82;
const SKIP = /image\/(gif|svg)/;
// Hosting platforms limit one request (Vercel ≈ 4.5 MB), so a whole form must stay under this.
const FORM_LIMIT = 4 * 1024 * 1024;

async function shrink(f: File): Promise<File> {
  if (!f.type.startsWith('image/') || SKIP.test(f.type) || f.size < 300 * 1024) return f;
  try {
    const bmp = await createImageBitmap(f);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', QUALITY));
    if (!blob || blob.size >= f.size) return f;
    return new File([blob], f.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return f; // e.g. HEIC on browsers that cannot decode it — upload as is
  }
}

function formSize(form: HTMLFormElement) {
  let n = 0;
  form.querySelectorAll<HTMLInputElement>('input[type=file]').forEach((i) => Array.from(i.files ?? []).forEach((f) => (n += f.size)));
  return n;
}

/**
 * Mounted once in the admin layout: every photo chosen in any file input is resized
 * (max 1800 px, JPEG) before the form is sent, so phone camera photos upload fast and fit size limits.
 */
export default function UploadCompressor() {
  useEffect(() => {
    const busy = new WeakSet<HTMLInputElement>();
    async function onChange(e: Event) {
      const input = e.target as HTMLInputElement;
      if (input?.type !== 'file' || !input.files?.length || busy.has(input)) return;
      busy.add(input);
      const form = input.form;
      const btns = form ? Array.from(form.querySelectorAll<HTMLButtonElement>('button[type=submit],button:not([type])')) : [];
      btns.forEach((b) => (b.disabled = true));
      try {
        const files = await Promise.all(Array.from(input.files).map(shrink));
        if (typeof DataTransfer !== 'undefined') {
          const dt = new DataTransfer();
          files.forEach((f) => dt.items.add(f));
          input.files = dt.files;
        }
        if (form && formSize(form) > FORM_LIMIT) {
          alert('These files are too large to send together (over 4 MB). Please choose fewer files or a shorter video.');
        }
      } finally {
        busy.delete(input);
        btns.forEach((b) => (b.disabled = false));
      }
    }
    document.addEventListener('change', onChange, true);
    return () => document.removeEventListener('change', onChange, true);
  }, []);
  return null;
}
