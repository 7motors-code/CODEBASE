import { requirePerm } from '@/lib/auth';
import { newBookingId } from '@/lib/ids';
import { pkInput } from '@/lib/format';
import { PageHeader } from '@/components/ui';
import BookingForm from '../BookingForm';
import { createBookingForm } from '../actions';
import { formData } from '../data';

export default async function NewBooking({ searchParams }: { searchParams: { err?: string } }) {
  await requirePerm('bookings', 'create');
  const d = await formData();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="New booking" subtitle="Fill the rental details. Pick several cars to make a group booking." />
      <BookingForm action={createBookingForm} bookingId={newBookingId()} now={pkInput()} err={searchParams.err} {...d} />
    </div>
  );
}
