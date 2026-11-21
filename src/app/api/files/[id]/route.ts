import { eq, or } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getUser } from '@/lib/auth';
import { INLINE_MIME } from '@/lib/files';

export const dynamic = 'force-dynamic';

// Customer documents (CNIC, signatures, thumbs) are private: only signed-in staff can open them.
// Vehicle photos are public because the customer portal shows them.
export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!/^[a-z0-9]{6,64}$/.test(params.id)) return new Response('Not found', { status: 404 });
  const [f] = await db.select().from(schema.files).where(eq(schema.files.id, params.id));
  if (!f) return new Response('Not found', { status: 404 });
  let isPublic = false;
  if (!(await getUser())) {
    const [car] = await db.select({ id: schema.vehicles.id }).from(schema.vehicles)
      .where(or(eq(schema.vehicles.cardPhotoId, f.id), eq(schema.vehicles.photoId, f.id)));
    if (!car) return new Response('Unauthorized', { status: 401 });
    isPublic = true;
  }
  // Older uploads may have any type: only known-safe types are shown in the browser, the rest are downloaded.
  const inline = INLINE_MIME.has(f.mime);
  return new Response(new Uint8Array(f.data), {
    headers: {
      'Content-Type': inline ? f.mime : 'application/octet-stream',
      'Content-Length': String(f.data.length),
      'Cache-Control': isPublic ? 'public, max-age=86400' : 'private, max-age=3600',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
