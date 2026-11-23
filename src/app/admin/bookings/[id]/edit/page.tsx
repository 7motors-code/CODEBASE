import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requirePerm } from '@/lib/auth';
import { pkInput } from '@/lib/format';
import { PageHeader } from '@/components/ui';
import BookingForm from '../../BookingForm';
import { updateBookingForm } from '../../actions';
import { formData } from '../../data';

export default async function EditBooking({ params, searchParams }: { params: { id: string }; searchParams: { err?: string } }) {
  await requirePerm('bookings', 'edit');
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, params.id));
  if (!b) notFound();
  const d = await formData(b.customerId);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={`Edit booking ${b.id}`} subtitle="Changes to dates or car are checked against other bookings." />
      <BookingForm action={updateBookingForm} bookingId={b.id} now={pkInput()} err={searchParams.err} {...d}
        existing={{ ...b, start: pkInput(b.startAt), end: pkInput(b.endAt) }} />
    </div>
  );
}
