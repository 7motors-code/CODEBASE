import 'server-only';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';

/**
 * Everything the booking form needs. Customers are not listed here: the form looks them up
 * on demand (findCustomers), and an edit loads only the booking's own customer.
 */
export async function formData(customerId?: string) {
  const [vehicles, drivers, locations, typeRows, customer] = await Promise.all([
    db.select({ id: schema.vehicles.id, model: schema.vehicles.model, regNo: schema.vehicles.regNo, rateDay: schema.vehicles.rateDay, rate12h: schema.vehicles.rate12h, meterReading: schema.vehicles.meterReading })
      .from(schema.vehicles).where(eq(schema.vehicles.active, true)).orderBy(schema.vehicles.model),
    db.select({ id: schema.drivers.id, name: schema.drivers.name, perDayFee: schema.drivers.perDayFee, paymentBasis: schema.drivers.paymentBasis })
      .from(schema.drivers).where(eq(schema.drivers.status, 'ACTIVE')).orderBy(schema.drivers.name),
    db.select({ id: schema.locations.id, name: schema.locations.name }).from(schema.locations).where(eq(schema.locations.active, true)),
    db.select().from(schema.lookups).where(eq(schema.lookups.kind, 'BOOKING_TYPE')),
    customerId
      ? db.select({ id: schema.customers.id, name: schema.customers.name, phone: schema.customers.phone, cnic: schema.customers.cnic, address: schema.customers.address, email: schema.customers.email, isCredit: schema.customers.isCredit, status: schema.customers.status })
        .from(schema.customers).where(eq(schema.customers.id, customerId)).then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);
  const types = typeRows.map((t) => t.name);
  return { vehicles, drivers, locations, customer, types: types.length ? types : ['Self-drive'] };
}
