import Link from 'next/link';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { Eye, Pencil, Trash2, Plus, Car, CheckCircle2, CalendarClock, Wrench, RotateCcw } from 'lucide-react';
import { db, schema } from '@/db';
import { requirePerm, can } from '@/lib/auth';
import { T } from '@/lib/prefs';
import { fleetStatus, V_STATUS_LABEL } from '@/lib/calc';
import { fmtDate, pkr } from '@/lib/format';
import { Badge, Card, Field, Kpi, Modal, PageHeader, Pagination, TableWrap, Thumb, Empty, href, paginate, Plate } from '@/components/ui';
import { ConfirmForm, ImageInput, Submit } from '@/components/client';
import { saveCar, deleteCar, restoreCar } from './actions';

type SP = { q?: string; status?: string; category?: string; new?: string; edit?: string; view?: string; err?: string; page?: string; show?: string; minRate?: string; maxRate?: string; color?: string };

export default async function CarsPage({ searchParams: sp }: { searchParams: SP }) {
  await requirePerm('cars');
  const t = T();
  const [canCreate, canEdit, canDelete] = await Promise.all([can('cars', 'create'), can('cars', 'edit'), can('cars', 'delete')]);
  const fleet = await fleetStatus();
  const inactive = sp.show === 'inactive' ? await db.select().from(schema.vehicles).where(eq(schema.vehicles.active, false)) : [];
  const categories = await db.select().from(schema.lookups).where(eq(schema.lookups.kind, 'CAR_CATEGORY')).orderBy(schema.lookups.name);
  const investors = await db.select().from(schema.investors).orderBy(schema.investors.name);
  const q = (sp.q ?? '').toLowerCase();
  const rows = fleet.filter((v) =>
    (!q || `${v.model} ${v.regNo} ${v.chassisNo ?? ''}`.toLowerCase().includes(q)) &&
    (!sp.status || v.vstatus === sp.status) && (!sp.category || v.category === sp.category) &&
    (!sp.color || (v.color ?? '').toLowerCase().includes(sp.color.toLowerCase())) &&
    (!sp.minRate || v.rateDay >= Number(sp.minRate)) && (!sp.maxRate || v.rateDay <= Number(sp.maxRate)));
  const pg = paginate(rows, sp.page);
  const base = { q: sp.q, status: sp.status, category: sp.category, color: sp.color, minRate: sp.minRate, maxRate: sp.maxRate };
  const editing = sp.edit ? fleet.find((v) => v.id === Number(sp.edit)) ?? (await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, Number(sp.edit))))[0] : null;
  const viewing = sp.view ? fleet.find((v) => v.id === Number(sp.view)) : null;
  const n = (k: string) => fleet.filter((v) => v.vstatus === k).length;

  return (
    <div className="space-y-6">
      <PageHeader title={t('cars')} subtitle="Manage your fleet, prices and availability">
        {canCreate && <Link href={href('/admin/cars', base, { new: 1 })} className="btn-primary"><Plus size={16} />{t('addNewCar')}</Link>}
      </PageHeader>
      {sp.err && !sp.new && !sp.edit && <p className="rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">{sp.err}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi featured label="Total vehicles" value={fleet.length} icon={<Car size={18} />} />
        <Kpi label="Available" value={n('AVAILABLE')} tone="green" icon={<CheckCircle2 size={18} />} />
        <Kpi label="Booked" value={n('BOOKED') + n('RESERVED') + n('RETURN')} tone="red" icon={<CalendarClock size={18} />} />
        <Kpi label="Maintenance" value={n('MAINTENANCE')} tone="yellow" icon={<Wrench size={18} />} />
      </div>
      <Card>
        <form className="no-print grid gap-2 p-4 md:grid-cols-[1fr_repeat(5,auto)]" method="get">
          <input name="q" defaultValue={sp.q} placeholder="Search by model, reg no or chassis" className="input" />
          <select name="category" defaultValue={sp.category} className="input"><option value="">All categories</option>{categories.map((c) => <option key={c.id}>{c.name}</option>)}</select>
          <select name="status" defaultValue={sp.status} className="input"><option value="">All status</option>{Object.entries(V_STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <input name="color" defaultValue={sp.color} placeholder="Colour" className="input w-28" />
          <div className="flex gap-1"><input name="minRate" defaultValue={sp.minRate} placeholder="Min/day" className="input w-24" /><input name="maxRate" defaultValue={sp.maxRate} placeholder="Max/day" className="input w-24" /></div>
          <button className="btn-ghost">Filter</button>
        </form>
        <TableWrap>
          <table className="tbl">
            <thead><tr><th>Vehicle</th><th>Category</th><th>Registration</th><th>Color</th><th className="!text-end">Day rate</th><th className="!text-end">12-hour rate</th><th>{t('status')}</th><th className="text-end">{t('actions')}</th></tr></thead>
            <tbody>
              {pg.slice.length === 0 && <Empty cols={8} />}
              {pg.slice.map((v) => (
                <tr key={v.id}>
                  <td><span className="flex items-center gap-3"><Thumb id={v.cardPhotoId ?? v.photoId} alt={v.model} /><span className="font-medium">{v.model}</span></span></td>
                  <td>{v.category}</td><td><Plate reg={v.regNo} /></td><td>{v.color ?? '—'}</td>
                  <td className="text-end font-mono tabular-nums">{pkr(v.rateDay)}</td><td className="text-end font-mono tabular-nums">{pkr(v.rate12h)}</td>
                  <td><Badge status={v.overdue ? 'OVERDUE' : v.vstatus} label={v.overdue ? 'Overdue' : V_STATUS_LABEL[v.vstatus]} /></td>
                  <td><div className="flex justify-end gap-1">
                    <Link href={href('/admin/cars', base, { view: v.id })} className="btn-ghost btn-sm" title="View"><Eye size={14} /></Link>
                    {canEdit && <Link href={href('/admin/cars', base, { edit: v.id })} className="btn-ghost btn-sm" title="Edit"><Pencil size={14} /></Link>}
                    {canDelete && <ConfirmForm action={deleteCar} hidden={{ id: v.id }} message={`Remove ${v.model} (${v.regNo})? Cars with booking history are deactivated, not erased.`} className="btn-ghost btn-sm text-bad"><Trash2 size={14} /></ConfirmForm>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <Pagination {...pg} makeHref={(p) => href('/admin/cars', base, { page: p })} />
        <div className="px-4 pb-4 text-xs"><Link className="link" href={sp.show === 'inactive' ? '/admin/cars' : '/admin/cars?show=inactive'}>{sp.show === 'inactive' ? 'Hide' : 'Show'} deactivated cars</Link></div>
        {inactive.length > 0 && (
          <div className="border-t border-line p-4"><p className="mb-2 text-sm font-medium">Deactivated cars</p>
            {inactive.map((v) => <div key={v.id} className="flex items-center justify-between py-1 text-sm"><span>{v.model} ({v.regNo})</span>{canEdit && <form action={restoreCar}><input type="hidden" name="id" value={v.id} /><button className="btn-ghost btn-sm"><RotateCcw size={13} /> Restore</button></form>}</div>)}
          </div>)}
      </Card>

      {(sp.new || editing) && (
        <Modal title={editing ? `Edit ${editing.model}` : 'Add vehicle'} closeHref={href('/admin/cars', base)} wide>
          <form action={saveCar} className="space-y-5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            {sp.err && <p className="rounded-xl bg-bad-soft px-4 py-2 text-sm text-bad">{sp.err}</p>}
            <p className="text-sm font-medium text-navy">Vehicle details</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Vehicle model" required><input name="model" required defaultValue={editing?.model} placeholder="e.g. Corolla 2023" className="input" /></Field>
              <Field label="Chassis no (optional)"><input name="chassisNo" defaultValue={editing?.chassisNo ?? ''} className="input" /></Field>
              <Field label="Registration number" required><input name="regNo" required defaultValue={editing?.regNo} placeholder="e.g. LEA-1234" className="input" /></Field>
              <Field label="Colour"><input name="color" defaultValue={editing?.color ?? ''} placeholder="e.g. White" className="input" /></Field>
              <Field label="Category" required><select name="category" defaultValue={editing?.category ?? 'Sedan'} className="input">{categories.map((c) => <option key={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Investor (owner)"><select name="investorId" defaultValue={editing?.investorId ?? ''} className="input"><option value="">Company owned</option>{investors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>
            </div>
            <p className="text-sm font-medium text-navy">Pricing &amp; meter</p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Day rate (PKR)" required><input name="rateDay" type="number" min={0} required defaultValue={editing?.rateDay} className="input" /></Field>
              <Field label="12-hour rate (PKR)" required><input name="rate12h" type="number" min={0} required defaultValue={editing?.rate12h} className="input" /></Field>
              <Field label="Meter reading (km)"><input name="meterReading" type="number" min={0} defaultValue={editing?.meterReading ?? 0} className="input" /></Field>
            </div>
            <p className="text-sm font-medium text-navy">Photos</p>
            <div className="grid gap-4 md:grid-cols-2">
              <ImageInput name="photo" label="Vehicle photo" required current={editing?.photoId} />
              <ImageInput name="cardPhoto" label="Car card photo (shown to customers)" current={editing?.cardPhotoId} />
            </div>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Link href={href('/admin/cars', base)} className="btn-ghost">{t('cancel')}</Link>
              <Submit>{editing ? t('save') : t('add')}</Submit>
            </div>
          </form>
        </Modal>
      )}
      {viewing && <CarDetail v={viewing} base={base} />}
    </div>
  );
}

async function CarDetail({ v, base }: { v: Awaited<ReturnType<typeof fleetStatus>>[number]; base: Record<string, string | undefined> }) {
  const bks = await db.select({ b: schema.bookings, c: schema.customers.name }).from(schema.bookings)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId)).where(eq(schema.bookings.vehicleId, v.id)).orderBy(desc(schema.bookings.startAt));
  const maint = await db.select().from(schema.maintenance).where(eq(schema.maintenance.vehicleId, v.id)).orderBy(desc(schema.maintenance.date));
  const dmg = await db.select().from(schema.damages).where(eq(schema.damages.vehicleId, v.id)).orderBy(desc(schema.damages.createdAt));
  const earned = bks.filter((x) => x.b.status !== 'CANCELLED').reduce((s, x) => s + x.b.totalAmount, 0);
  const inv = v.investorId ? (await db.select().from(schema.investors).where(eq(schema.investors.id, v.investorId)))[0] : null;
  void and; void gte; void inArray; void sql;
  return (
    <Modal title={`${v.model} · ${v.regNo}`} closeHref={href('/admin/cars', base)} wide>
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="space-y-2"><Thumb id={v.photoId} alt={v.model} size={220} />{v.cardPhotoId && <Thumb id={v.cardPhotoId} alt="card" size={100} />}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['Status', <Badge key="s" status={v.vstatus} label={V_STATUS_LABEL[v.vstatus]} />], ['Category', v.category], ['Color', v.color ?? '—'], ['Chassis', v.chassisNo ?? '—'],
            ['Per day', pkr(v.rateDay)], ['12 hours', pkr(v.rate12h)], ['Meter', `${v.meterReading.toLocaleString()} km`], ['Owner', inv ? `Investor: ${inv.name}` : 'Company'],
            ['Bookings', bks.length], ['Revenue earned', pkr(earned)]].map(([k, val]) => (
            <div key={String(k)} className="rounded-xl bg-panel2 p-3"><p className="text-xs text-muted">{k}</p><p className="font-medium">{val}</p></div>))}
        </div>
      </div>
      <h3 className="mt-6 mb-2 font-medium">Booking history</h3>
      <table className="tbl"><thead><tr><th>ID</th><th>Customer</th><th>Dates</th><th>Status</th><th>Total</th></tr></thead><tbody>
        {bks.length === 0 && <Empty cols={5} />}
        {bks.slice(0, 10).map(({ b, c }) => <tr key={b.id}><td><Link className="link" href={`/admin/bookings/${b.id}`}>{b.id}</Link></td><td>{c}</td><td>{fmtDate(b.startAt)} – {fmtDate(b.endAt)}</td><td><Badge status={b.status} /></td><td>{pkr(b.totalAmount)}</td></tr>)}
      </tbody></table>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div><h3 className="mb-2 font-medium">Maintenance history</h3>{maint.length === 0 ? <p className="text-sm text-muted">None</p> : maint.map((m) => <p key={m.id} className="border-b border-line py-1.5 text-sm">{m.date} · {m.types.join(', ')} · {pkr(m.cost)} <Badge status={m.status} /></p>)}</div>
        <div><h3 className="mb-2 font-medium">Damage history</h3>{dmg.length === 0 ? <p className="text-sm text-muted">None</p> : dmg.map((d) => <p key={d.id} className="border-b border-line py-1.5 text-sm">{fmtDate(d.createdAt)} · {d.damageType} · {pkr(d.estimatedCost)} <Badge status={d.status} /></p>)}</div>
      </div>
    </Modal>
  );
}
