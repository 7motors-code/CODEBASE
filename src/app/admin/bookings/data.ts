import 'server-only';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';

export async function formData() {
  const vehicles = await db.select({ id: schema.vehicles.id, model: schema.vehicles.model, regNo: schema.vehicles.regNo, rateDay: schema.vehicles.rateDay, rate12h: schema.vehicles.rate12h, meterReading: schema.vehicles.meterReading })
    .from(schema.vehicles).where(eq(schema.vehicles.active, true)).orderBy(schema.vehicles.model);
  const drivers = await db.select({ id: schema.drivers.id, name: schema.drivers.name, perDayFee: schema.drivers.perDayFee, paymentBasis: schema.drivers.paymentBasis })
    .from(schema.drivers).where(eq(schema.drivers.status, 'ACTIVE')).orderBy(schema.drivers.name);
  const customers = await db.select({ id: schema.customers.id, name: schema.customers.name, phone: schema.customers.phone, cnic: schema.customers.cnic, address: schema.customers.address, email: schema.customers.email, isCredit: schema.customers.isCredit, status: schema.customers.status })
    .from(schema.customers).orderBy(schema.customers.name);
  const locations = await db.select({ id: schema.locations.id, name: schema.locations.name }).from(schema.locations).where(eq(schema.locations.active, true));
  const types = (await db.select().from(schema.lookups).where(eq(schema.lookups.kind, 'BOOKING_TYPE'))).map((t) => t.name);
  return { vehicles, drivers, customers, locations, types: types.length ? types : ['Self-drive'] };
}
