'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { can, requirePerm } from '@/lib/auth';
import { saveUpload } from '@/lib/files';
import { str } from '@/lib/format';
import { oneOf } from '@/lib/security';

export async function createRequest(fd: FormData) {
  const u = await requirePerm('devRequests', 'create');
  const title = String(fd.get('title') ?? '').trim().slice(0, 200);
  if (!title) redirect('/admin/dev-requests?new=1&err=Title+is+required');
  const screenshotId = await saveUpload(fd.get('screenshot'));
  const priority = oneOf(fd.get('priority'), ['LOW', 'MEDIUM', 'HIGH'] as const, 'MEDIUM');
  const [r] = await db.insert(schema.devRequests).values({ title, description: str(fd.get('description')), priority, screenshotId, createdByName: u.name }).returning();
  revalidatePath('/admin/dev-requests');
  redirect(`/admin/dev-requests?id=${r.id}`);
}
export async function replyRequest(fd: FormData) {
  const u = await requirePerm('devRequests', 'view');
  const id = Number(fd.get('id'));
  if (!Number.isInteger(id) || id <= 0) redirect('/admin/dev-requests');
  const message = String(fd.get('message') ?? '').trim().slice(0, 5000);
  if (message) await db.insert(schema.devReplies).values({ requestId: id, message, authorName: u.name });
  const status = str(fd.get('status'));
  if (status && (await can('devRequests', 'edit'))) {
    await db.update(schema.devRequests).set({ status: oneOf(status, ['OPEN', 'IN_PROGRESS', 'DONE'] as const, 'OPEN') }).where(eq(schema.devRequests.id, id));
  }
  revalidatePath('/admin/dev-requests');
  redirect(`/admin/dev-requests?id=${id}`);
}
