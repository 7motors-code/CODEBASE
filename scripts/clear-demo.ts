import 'dotenv/config';
import { db, schema } from '../src/db';

async function main() {
  console.log('Removing all dummy / demo data...');

  // Delete records in reverse dependency order
  await db.delete(schema.receivings);
  await db.delete(schema.payments);
  await db.delete(schema.maintenance);
  await db.delete(schema.damages);
  await db.delete(schema.driverPayments);
  await db.delete(schema.investorPayouts);
  await db.delete(schema.bookings);
  await db.delete(schema.vehicles);
  await db.delete(schema.drivers);
  await db.delete(schema.customers);
  await db.delete(schema.investors);
  await db.delete(schema.expenses);
  await db.delete(schema.activityLogs);
  await db.delete(schema.devReplies);
  await db.delete(schema.devRequests);
  await db.delete(schema.files);

  console.log('All dummy / demo data removed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to remove dummy data:', err);
  process.exit(1);
});
