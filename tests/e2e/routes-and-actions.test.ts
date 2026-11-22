import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { db, schema, closePool } from '../../src/db';
import { sign, SESSION_COOKIE } from '../../src/lib/session';
import { passwordVersion } from '../../src/lib/security';
import { eq } from 'drizzle-orm';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let serverAvailable = true;

test.before(async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    serverAvailable = res.ok;
  } catch {
    serverAvailable = false;
  }
});

test.after(async () => {
  await closePool();
});

async function getAdminCookie(): Promise<string> {
  const [admin] = await db.select().from(schema.users).where(eq(schema.users.role, 'ADMIN')).limit(1);
  if (!admin) throw new Error('No admin user found in database. Please run db:seed.');
  const pv = passwordVersion(admin.passwordHash);
  const token = await sign({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    pv,
  }, 7);
  return `${SESSION_COOKIE}=${token}`;
}

test('E2E: Health API route returns 200 and ok: true', async (t) => {
  if (!serverAvailable) {
    t.skip(`Next.js server is not running on ${BASE_URL}. Start server with 'npm run dev' or 'npm start' to run E2E suite.`);
    return;
  }
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
});

test('E2E: Public routes render 200 OK', async (t) => {
  if (!serverAvailable) {
    t.skip(`Next.js server is not running on ${BASE_URL}.`);
    return;
  }
  const publicRoutes = ['/login', '/portal', '/portal/my'];
  for (const route of publicRoutes) {
    const res = await fetch(`${BASE_URL}${route}`);
    assert.equal(res.status, 200, `Expected 200 for ${route}`);
    const text = await res.text();
    assert.ok(text.length > 200, `Expected body content for ${route}`);
    assert.ok(!text.includes('Application error: a server-side exception has occurred'), `Crash on ${route}`);
  }
});

test('E2E: All 16 PRD Admin modules and pages render 200 OK for Authenticated Staff', async (t) => {
  if (!serverAvailable) {
    t.skip(`Next.js server is not running on ${BASE_URL}.`);
    return;
  }
  const cookie = await getAdminCookie();
  const adminRoutes = [
    '/admin',
    '/admin/cars',
    '/admin/bookings',
    '/admin/bookings/new',
    '/admin/receiving',
    '/admin/maintenance',
    '/admin/damage',
    '/admin/drivers',
    '/admin/customers',
    '/admin/investors',
    '/admin/payments',
    '/admin/expenses',
    '/admin/reports',
    '/admin/locations',
    '/admin/users',
    '/admin/dev-requests',
    '/admin/search?q=test',
  ];

  for (const route of adminRoutes) {
    const res = await fetch(`${BASE_URL}${route}`, {
      headers: { Cookie: cookie },
      redirect: 'manual',
    });
    assert.equal(res.status, 200, `Expected 200 for ${route}, got ${res.status}`);
    const text = await res.text();
    assert.ok(text.length > 500, `Expected substantial content on ${route}`);
    assert.ok(!text.includes('Application error: a client-side exception has occurred'), `Client exception on ${route}`);
    assert.ok(!text.includes('Application error: a server-side exception has occurred'), `Server exception on ${route}`);
  }
});

test('E2E: Detail views, receipts, and printable agreements render 200 OK', async (t) => {
  if (!serverAvailable) {
    t.skip(`Next.js server is not running on ${BASE_URL}.`);
    return;
  }
  const cookie = await getAdminCookie();
  const [b] = await db.select({ id: schema.bookings.id }).from(schema.bookings).limit(1);
  if (b) {
    // Booking detail
    const resDetail = await fetch(`${BASE_URL}/admin/bookings/${b.id}`, { headers: { Cookie: cookie } });
    assert.equal(resDetail.status, 200);

    // Booking print paper
    const resPrint = await fetch(`${BASE_URL}/admin/bookings/${b.id}/print`, { headers: { Cookie: cookie } });
    assert.equal(resPrint.status, 200);
    const printText = await resPrint.text();
    assert.ok(printText.includes('Vehicle Rental Agreement'));
  }

  const [p] = await db.select({ id: schema.payments.id }).from(schema.payments).limit(1);
  if (p) {
    // Payment receipt print view
    const resReceipt = await fetch(`${BASE_URL}/admin/payments/receipt/${p.id}`, { headers: { Cookie: cookie } });
    assert.equal(resReceipt.status, 200);
    const receiptText = await resReceipt.text();
    assert.ok(receiptText.includes('PAYMENT RECEIPT'));
  }
});

test('E2E: Authenticated APIs (Availability & Export) return 200 with valid data', async (t) => {
  if (!serverAvailable) {
    t.skip(`Next.js server is not running on ${BASE_URL}.`);
    return;
  }
  const cookie = await getAdminCookie();

  // Availability API
  const start = '2026-12-01T10:00';
  const end = '2026-12-05T10:00';
  const resAvail = await fetch(`${BASE_URL}/api/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
    headers: { Cookie: cookie },
  });
  assert.equal(resAvail.status, 200);
  const avail = await resAvail.json();
  assert.ok(Array.isArray(avail.vehicles));
  assert.ok(Array.isArray(avail.drivers));

  // CSV Report Export API
  const resExport = await fetch(`${BASE_URL}/api/export/report?from=2026-11-01&to=2026-11-30`, {
    headers: { Cookie: cookie },
  });
  assert.equal(resExport.status, 200);
  assert.ok(resExport.headers.get('content-type')?.includes('text/csv'));
  const csv = await resExport.text();
  assert.ok(csv.includes('Seven Motors report'));
  assert.ok(csv.includes('Total revenue'));
});
