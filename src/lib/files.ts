import 'server-only';
import { db, schema } from '@/db';
import { newFileId } from './ids';

const MAX = 8 * 1024 * 1024;

/**
 * File types staff may upload. Anything else (HTML, SVG, scripts…) is refused because
 * the browser could run it on our domain (stored XSS).
 */
export const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
  'application/pdf', 'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp',
]);
/** Types the browser may show inline; everything else is downloaded */
export const INLINE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/webm']);

/** Checks the first bytes so a renamed .html file cannot pretend to be a .jpg */
function sniff(buf: Buffer): string | null {
  const h = buf.subarray(0, 16);
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return 'image/jpeg';
  if (h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (h.subarray(0, 4).toString('latin1') === 'GIF8') return 'image/gif';
  if (h.subarray(0, 4).toString('latin1') === 'RIFF' && h.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (h.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (h.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = h.subarray(8, 12).toString('latin1');
    if (/^hei|^mif1|^msf1|^heix/.test(brand)) return 'image/heic';
    if (brand === 'qt  ') return 'video/quicktime';
    if (brand.startsWith('3g')) return 'video/3gpp';
    return 'video/mp4';
  }
  if (h[0] === 0x1a && h[1] === 0x45 && h[2] === 0xdf && h[3] === 0xa3) return 'video/webm';
  return null;
}

const cleanName = (n: string) => (n || 'upload').replace(/[\\/\r\n"<>]/g, '_').slice(0, 120);

/** Saves an uploaded File (from FormData) and returns its id, or null if empty */
export async function saveUpload(v: FormDataEntryValue | null): Promise<string | null> {
  if (!v || typeof v === 'string') return null;
  const f = v as File;
  if (!f.size) return null;
  if (f.size > MAX) throw new Error(`File ${f.name} is larger than 8 MB.`);
  const buf = Buffer.from(await f.arrayBuffer());
  // The type is decided from the file's real content, never from the name or browser-sent type.
  const mime = sniff(buf);
  if (!mime || !ALLOWED_MIME.has(mime)) throw new Error(`"${cleanName(f.name)}" is not an allowed file type. Use a photo (JPG/PNG/WEBP), PDF or video.`);
  const id = newFileId();
  await db.insert(schema.files).values({ id, name: cleanName(f.name), mime, size: f.size, data: buf });
  return id;
}

export async function saveUploads(list: FormDataEntryValue[]): Promise<string[]> {
  const ids: string[] = [];
  for (const v of list.slice(0, 20)) { const id = await saveUpload(v); if (id) ids.push(id); }
  return ids;
}

/** Saves a data URL (e.g. a drawn signature). Only PNG/JPEG images are accepted. */
export async function saveDataUrl(dataUrl: string | null, name: string): Promise<string | null> {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  const m = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length < 200) return null; // empty canvas
  if (buf.length > MAX) return null;
  const mime = sniff(buf);
  if (mime !== 'image/png' && mime !== 'image/jpeg') return null;
  const id = newFileId();
  await db.insert(schema.files).values({ id, name: cleanName(name), mime, size: buf.length, data: buf });
  return id;
}

export const fileUrl = (id: string | null | undefined) => (id ? `/api/files/${id}` : null);
