import Link from 'next/link';
import { ilike, or } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/auth';
import { fmtDate, pkr } from '@/lib/format';
import { Badge, Card, PageHeader } from '@/components/ui';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireUser();
  const q = (searchParams.q ?? '').trim();
  const like = `%${q}%`;
  const [bookings, customers, cars] = q ? await Promise.all([
    db.select().from(schema.bookings).where(or(ilike(schema.bookings.id, like), ilike(schema.bookings.groupId, like))).limit(20),
    db.select().from(schema.customers).where(or(ilike(schema.customers.name, like), ilike(schema.customers.phone, like), ilike(schema.customers.cnic, like), ilike(schema.customers.id, like))).limit(20),
    db.select().from(schema.vehicles).where(or(ilike(schema.vehicles.model, like), ilike(schema.vehicles.regNo, like))).limit(20),
  ]) : [[], [], []];
  return (
    <div className="space-y-4">
      <PageHeader title="Search" subtitle={q ? `Results for “${q}”` : 'Search bookings, customers and cars'} />
      <form method="get" className="flex gap-2"><input name="q" defaultValue={q} autoFocus className="input max-w-lg" placeholder="Booking ID, name, phone, CNIC, car or plate" /><button className="btn-primary">Search</button></form>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={`Bookings (${bookings.length})`}>{bookings.map((b) => <Link key={b.id} href={`/admin/bookings/${b.id}`} className="block border-b border-line px-4 py-2 text-sm hover:bg-panel2"><span className="font-mono text-navy">{b.id}</span> <Badge status={b.status} /><span className="block text-xs text-muted">{fmtDate(b.startAt)} · {pkr(b.totalAmount)}</span></Link>)}</Card>
        <Card title={`Customers (${customers.length})`}>{customers.map((c) => <Link key={c.id} href={`/admin/customers?id=${c.id}`} className="block border-b border-line px-4 py-2 text-sm hover:bg-panel2"><span className="font-medium">{c.name}</span><span className="block text-xs text-muted">{c.phone} · {c.cnic ?? ''}</span></Link>)}</Card>
        <Card title={`Cars (${cars.length})`}>{cars.map((v) => <Link key={v.id} href={`/admin/cars?view=${v.id}`} className="block border-b border-line px-4 py-2 text-sm hover:bg-panel2"><span className="font-medium">{v.model}</span><span className="block text-xs text-muted">{v.regNo} · {pkr(v.rateDay)}/day</span></Link>)}</Card>
      </div>
    </div>
  );
}
