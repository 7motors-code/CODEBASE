import Image from 'next/image';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { getSetting } from '@/lib/calc';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const business = await getSetting('business_name', 'Seven Motors');
  return (
    <main className="grid min-h-screen bg-bg lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="self-start"><BrandMark name={business} caption="Office" size={36} priority /></Link>
        <div className="my-auto w-full max-w-sm py-12">
          <h1 className="text-[28px] font-medium tracking-[-0.01em] text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-ink2">For staff of {business}. Customers can track a booking from the <Link href="/portal/my" className="link">customer portal</Link>.</p>
          <div className="mt-8"><LoginForm /></div>
        </div>
        <p className="text-[13px] text-muted">© {new Date().getFullYear()} {business}</p>
      </div>
      <div className="relative hidden overflow-hidden bg-[#101216] lg:block">
        <Image src="/cars/land-cruiser.jpg" alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-10 pt-24">
          <p className="max-w-sm text-[15px] leading-relaxed text-white/85">Bookings, returns, payments and the whole fleet in one place.</p>
        </div>
      </div>
    </main>
  );
}
