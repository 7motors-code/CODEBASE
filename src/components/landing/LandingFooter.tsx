import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Shield, Heart } from 'lucide-react';

export function LandingFooter({ businessName = 'Seven Motors' }: { businessName?: string }) {
  return (
    <footer className="border-t border-white/10 bg-navy-dark pt-16 pb-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-gold to-gold-dark p-0.5 shadow-md">
                <Image
                  src="/logo.jpg"
                  alt="Seven Motors"
                  width={40}
                  height={40}
                  className="h-full w-full rounded-[10px] object-cover"
                />
              </div>
              <div>
                <span className="text-base font-black tracking-wider text-white">
                  {businessName.toUpperCase()}
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-gold/90">
                  Smart Car Rental
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-white/60">
              Pakistan&apos;s leading car rental management ecosystem. Verified fleet, transparent pricing, 24-hour full day & 12-hour shift rates across all major metropolitan cities.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
              <Phone size={13} className="text-gold" />
              <span>24/7 Helpline: <strong>0300-SEVEN-M</strong></span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold">Explore Fleet</h4>
            <ul className="mt-4 space-y-2 text-xs text-white/70">
              <li><a href="#fleet" className="hover:text-gold transition">All Available Vehicles</a></li>
              <li><a href="#fleet" className="hover:text-gold transition">SUVs & 4x4s (Fortuner, Prado)</a></li>
              <li><a href="#fleet" className="hover:text-gold transition">Sedans (Civic, Corolla, Yaris)</a></li>
              <li><a href="#fleet" className="hover:text-gold transition">Economy & Hatchbacks</a></li>
              <li><a href="#fleet" className="hover:text-gold transition">Chauffeur-Driven Options</a></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold">Customer Services</h4>
            <ul className="mt-4 space-y-2 text-xs text-white/70">
              <li><Link href="/portal/my" className="hover:text-gold transition">Track My Booking Status</Link></li>
              <li><Link href="/portal" className="hover:text-gold transition">Online Reservation Portal</Link></li>
              <li><a href="#locations" className="hover:text-gold transition">Airport Meet & Greet Hubs</a></li>
              <li><a href="#experience" className="hover:text-gold transition">1-Hour Grace Policy</a></li>
              <li><a href="#concierge" className="hover:text-gold transition">VIP & Wedding Convoys</a></li>
            </ul>
          </div>

          {/* Operating Locations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold">Primary Hubs</h4>
            <ul className="mt-4 space-y-2.5 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 text-gold shrink-0" />
                <span><strong>Islamabad / RWP:</strong> Blue Area & ISB Airport VIP Terminal</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 text-gold shrink-0" />
                <span><strong>Lahore:</strong> DHA Phase 5 & Allama Iqbal Airport</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 text-gold shrink-0" />
                <span><strong>Karachi:</strong> Clifton Block 4 & Jinnah Airport Terminal 1</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-[11px] text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/portal/my" className="hover:text-white transition">My Bookings</Link>
            <span>·</span>
            <Link href="/login" className="flex items-center gap-1 text-gold/80 hover:text-gold transition">
              <Shield size={12} />
              <span>Staff Login</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
