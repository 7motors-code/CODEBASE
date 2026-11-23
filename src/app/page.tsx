import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getSetting } from '@/lib/calc';
import { cacheGet, cacheSet } from '@/lib/redis';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { FleetExplorer, VehicleCardData } from '@/components/landing/FleetExplorer';
import { ExperienceSection } from '@/components/landing/ExperienceSection';
import { DEFAULT_HUBS, LocationsSection, type Hub } from '@/components/landing/LocationsSection';
import { buildContact } from '@/lib/contact';
import type { ClassStats } from '@/components/landing/car-classes';
import { ConciergeSection } from '@/components/landing/ConciergeSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Seven Motors — Car rental in Islamabad, Lahore and Karachi',
  description:
    'Rent a car in Islamabad, Rawalpindi, Lahore and Karachi by the 24-hour day or the 12-hour shift. Self-drive or with a driver.',
  keywords: [
    'Car Rental Pakistan',
    'Rent a car Islamabad',
    'Luxury car rental Lahore',
    'Rent a car Karachi Airport',
    'Chauffeur drive Fortuner',
    'Civic rental Islamabad',
  ],
  openGraph: {
    title: 'Seven Motors — Car rental by the day or the 12-hour shift',
    description: 'Self-drive or with a driver in Islamabad, Rawalpindi, Lahore and Karachi.',
    images: [{ url: '/logo.jpg', width: 800, height: 800, alt: 'Seven Motors Fleet' }],
  },
};

export default async function HomePage() {
  const cacheKey = 'vehicles:landing:active';
  let vehicles = await cacheGet<VehicleCardData[]>(cacheKey);

  if (!vehicles) {
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

    vehicles = carsRaw.map((c) => ({
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

    await cacheSet(cacheKey, vehicles, 180);
  }

  const [businessName, phoneSetting, address, graceSetting, branchRows] = await Promise.all([
    getSetting('business_name', 'Seven Motors'),
    getSetting('business_phone', ''),
    getSetting('business_address', ''),
    getSetting('fine_grace_hours', '1'),
    db
      .select({ id: schema.locations.id, name: schema.locations.name, city: schema.locations.city, address: schema.locations.address })
      .from(schema.locations)
      .where(eq(schema.locations.active, true))
      .orderBy(schema.locations.name),
  ]);
  const contact = buildContact(phoneSetting);
  const parsedGrace = Number.parseInt(graceSetting, 10);
  const graceHours = Number.isFinite(parsedGrace) && parsedGrace >= 0 ? parsedGrace : 1;
  const hubs: Hub[] = branchRows.length > 0 ? branchRows : DEFAULT_HUBS;
  const classStats = vehicles.reduce<ClassStats>((acc, v) => {
    const prev = acc[v.category] ?? { count: 0, fromDay: null };
    return {
      ...acc,
      [v.category]: { count: prev.count + 1, fromDay: prev.fromDay === null ? v.rateDay : Math.min(prev.fromDay, v.rateDay) },
    };
  }, {});
  // Vehicles are ordered by day rate, so the first one is the cheapest real example.
  const example = vehicles[0] ? { model: vehicles[0].model, rateDay: vehicles[0].rateDay, rate12h: vehicles[0].rate12h } : null;

  return (
    <div className="min-h-screen bg-bg text-ink">
      <LandingNav businessName={businessName} phone={contact.phone} telHref={contact.telHref} />
      <main>
        <HeroSection totalVehicles={vehicles.length} graceHours={graceHours} classStats={classStats} />
        <FleetExplorer vehicles={vehicles} phone={contact.phone} telHref={contact.telHref} whatsappHref={contact.whatsappHref} />
        <ExperienceSection graceHours={graceHours} example={example} />
        <LocationsSection hubs={hubs} phone={contact.phone} telHref={contact.telHref} whatsappHref={contact.whatsappHref} />
        <ConciergeSection whatsappHref={contact.whatsappHref} />
      </main>
      <LandingFooter businessName={businessName} phone={contact.phone} telHref={contact.telHref} address={address} />
    </div>
  );
}
