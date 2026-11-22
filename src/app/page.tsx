import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getSetting } from '@/lib/calc';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { FleetExplorer, VehicleCardData } from '@/components/landing/FleetExplorer';
import { ExperienceSection } from '@/components/landing/ExperienceSection';
import { LocationsSection } from '@/components/landing/LocationsSection';
import { ConciergeSection } from '@/components/landing/ConciergeSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const revalidate = 60; // Incremental Static Regeneration every 60 seconds

export const metadata: Metadata = {
  title: 'Seven Motors — Luxury & Economy Car Rental in Pakistan',
  description:
    'Book premium and economy rental cars in Islamabad, Rawalpindi, Lahore, and Karachi. Self-drive and chauffeur options, 24-hour day and 12-hour shift rates with 1-hour return grace.',
  keywords: [
    'Car Rental Pakistan',
    'Rent a car Islamabad',
    'Luxury car rental Lahore',
    'Rent a car Karachi Airport',
    'Chauffeur drive Fortuner',
    'Civic rental Islamabad',
  ],
  openGraph: {
    title: 'Seven Motors — Smart Car Rental Management',
    description: 'Pakistan premier luxury and economy car rental with transparent pricing and 60-second booking.',
    images: [{ url: '/logo.jpg', width: 800, height: 800, alt: 'Seven Motors Fleet' }],
  },
};

export default async function HomePage() {
  // Query only the required columns to maximize query speed and avoid N+1 issues
  const carsRaw = await db
    .select({
      id: schema.vehicles.id,
      model: schema.vehicles.model,
      category: schema.vehicles.category,
      color: schema.vehicles.color,
      rateDay: schema.vehicles.rateDay,
      rate12h: schema.vehicles.rate12h,
      photoId: schema.vehicles.photoId,
      cardPhotoId: schema.vehicles.cardPhotoId,
      meterReading: schema.vehicles.meterReading,
      regNo: schema.vehicles.regNo,
    })
    .from(schema.vehicles)
    .where(eq(schema.vehicles.active, true))
    .orderBy(schema.vehicles.rateDay);

  const businessName = await getSetting('business_name', 'Seven Motors');

  const vehicles: VehicleCardData[] = carsRaw.map((c) => ({
    id: c.id,
    model: c.model,
    category: c.category,
    color: c.color,
    rateDay: c.rateDay,
    rate12h: c.rate12h,
    photoId: c.photoId,
    cardPhotoId: c.cardPhotoId,
    meterReading: c.meterReading,
    regNo: c.regNo,
  }));

  return (
    <div className="min-h-screen bg-navy-dark text-white selection:bg-gold selection:text-navy-dark">
      {/* Liquid Glass Navigation */}
      <LandingNav businessName={businessName} />

      {/* Main Content Area */}
      <main>
        {/* Hero with Luminous Background and Live Booking Search */}
        <HeroSection totalVehicles={vehicles.length} />

        {/* Interactive Fleet Showcase with Debounced Search & Instant Booking Modal */}
        <FleetExplorer vehicles={vehicles} />

        {/* The Seven Motors Experience & 1-Hour Grace Policy */}
        <ExperienceSection />

        {/* Airport Hubs and Locations Showcase */}
        <LocationsSection />

        {/* VIP Protocol, Convoys, and Concierge Custom Leads */}
        <ConciergeSection />
      </main>

      {/* High-End Automotive Footer */}
      <LandingFooter businessName={businessName} />
    </div>
  );
}
