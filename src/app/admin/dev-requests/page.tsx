import Link from 'next/link';
import { asc, desc, eq } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { fmtDateTime } from '@/lib/format';
import { Badge, Card, Field, Modal, PageHeader, Thumb } from '@/components/ui';
import { Submit } from '@/components/client';
import { createRequest, replyRequest } from './actions';

export default async function DevRequests({ searchParams: sp }: { searchParams: { new?: string; id?: string; err?: string } }) {
  await requirePerm('devRequests');
  const canCreate = await can('devRequests', 'create');
  const canEdit = await can('devRequests', 'edit');
  const rows = await db.select().from(schema.devRequests).orderBy(desc(schema.devRequests.createdAt));
  const sel = sp.id ? rows.find((r) => r.id === Number(sp.id)) : undefined;
  const replies = sel ? await db.select().from(schema.devReplies).where(eq(schema.devReplies.requestId, sel.id)).orderBy(asc(schema.devReplies.createdAt)) : [];
  return (
    <div>
      <PageHeader title="Dev Requests" subtitle="Report a problem or ask the software team for a new feature">
        {canCreate && <Link href="/admin/dev-requests?new=1" className="btn-gold"><Plus size={16} /> New request</Link>}
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">No requests yet.</p>}
          {rows.map((r) => (
            <Link key={r.id} href={`/admin/dev-requests?id=${r.id}`} className={`block border-b border-line p-4 hover:bg-panel2 ${sel?.id === r.id ? 'bg-gold/10' : ''}`}>
              <div className="flex items-center gap-2"><span className="font-semibold">#{r.id} {r.title}</span><span className="ms-auto flex gap-1"><Badge status={r.priority} /><Badge status={r.status} /></span></div>
              <p className="text-xs text-muted">{r.createdByName} · {fmtDateTime(r.createdAt)}</p>
            </Link>))}
        </Card>
        {sel && (
          <Card title={`#${sel.id} ${sel.title}`}>
            <div className="space-y-3 p-5 text-sm">
              {sel.description && <p className="whitespace-pre-wrap">{sel.description}</p>}
              {sel.screenshotId && <a href={`/api/files/${sel.screenshotId}`} target="_blank"><Thumb id={sel.screenshotId} alt="screenshot" size={200} /></a>}
              {replies.map((x) => <div key={x.id} className="rounded-xl bg-panel2 p-3"><p className="text-xs text-muted">{x.authorName} · {fmtDateTime(x.createdAt)}</p><p className="whitespace-pre-wrap">{x.message}</p></div>)}
              <form action={replyRequest} className="space-y-2 border-t border-line pt-3">
                <input type="hidden" name="id" value={sel.id} />
                <textarea name="message" rows={3} className="input" placeholder="Write a reply…" />
                <div className="flex items-center gap-2">{canEdit && <select name="status" defaultValue="" className="input w-48"><option value="">Keep status ({sel.status})</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select>}<Submit>Send</Submit></div>
              </form>
            </div>
          </Card>)}
      </div>
      {sp.new && (
        <Modal title="New dev request" closeHref="/admin/dev-requests">
          <form action={createRequest} className="space-y-4">
            {sp.err && <p className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm text-rose-300">{sp.err}</p>}
            <Field label="Title" required><input name="title" required className="input" placeholder="e.g. Add WhatsApp reminder for returns" /></Field>
            <Field label="Description"><textarea name="description" rows={4} className="input" /></Field>
            <Field label="Priority"><select name="priority" defaultValue="MEDIUM" className="input"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></Field>
            <Field label="Screenshot"><input type="file" name="screenshot" accept="image/*" className="text-sm" /></Field>
            <div className="flex justify-end gap-2"><Link href="/admin/dev-requests" className="btn-ghost">Cancel</Link><Submit>Send request</Submit></div>
          </form>
        </Modal>)}
    </div>
  );
}
