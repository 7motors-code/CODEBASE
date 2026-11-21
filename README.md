# CODEBASE — Seven Motors Car Rental Management System

A complete rent-a-car management system for **Seven Motors**, built from the PRD
"Smart Rental — Car Rental Management System (7 Motors)".

Admin panel + customer portal · English / اردو (RTL) · dark & light theme · PKR · Pakistan time.

## Modules

| Area | Module | What it does |
| --- | --- | --- |
| Overview | Dashboard | Revenue, active bookings, customers (vs last month), 12-month revenue chart, fleet donut, fleet status by any date (who is free / due back), recent bookings |
| Operations | Car Management | Fleet register with photos, per-day & 12-hour prices, meter, investor owner, live status, history |
| | Bookings | Full booking form (customer lookup, CNIC images, guarantor, signature pad, thumb image, multi-car group bookings, driver, live total, advance), status flow, printable rental paper |
| | Vehicle Receiving | Find by booking ID / phone / CNIC / plate, meter & fuel in, suggested late fine, return photos, collect balance, raise damage |
| | Maintenance | Scheduled / in workshop / completed / overdue, multiple types, cost, next oil change reminder |
| | Customer Damage | Incident from booking, evidence upload, cost, collect / waive, damage income tracked separately |
| People | Drivers | Per-booking or salary drivers, earned / paid / pending ledger, pay (posts to Expenses), licence expiry alerts |
| | Credit Customer | Profiles, overview + activity timeline, credit (monthly account) customers, credit limit, block, monthly statement |
| | User Management | Staff logins, roles (Admin / Manager / Staff / Accountant / custom), permission matrix, business settings, activity log |
| | Investors | Cars per investor, monthly payout: revenue × share % − maintenance, profit by car, mark as paid (posts to Expenses), printable statement |
| Finance | Payments | Revenue, today's, pending, received, damage income; per-booking balances; calendar of daily receipts; receipts |
| | Expense | Categories, monthly chart, category chart, receipts upload |
| | Reports | Daily / any range: revenue, expenses, profit, cash sales, pending, counts, YTD chart, export to Excel (CSV) and print / PDF |
| System | Locations, Dev Requests | Branches used in bookings; support requests to the developer with replies |
| Portal | Switch to Customer | Public car list with availability check, booking requests (arrive as Pending), "My bookings" login with phone + CNIC |

Also: notification bell (pending requests, cars due back, overdue returns, maintenance overdue, oil change due,
licence expiry, month-end payouts), floating voice button (say a module name or search, Chrome), global search.

## Tech

Next.js 14 (App Router, server actions) · TypeScript · Tailwind CSS · PostgreSQL (Neon) with Drizzle ORM ·
uploads stored in the database (no extra storage service needed) · Recharts.

## Run it locally (Windows / Mac)

1. Install **Node.js 20 or newer** from nodejs.org.
2. In this folder, create a file named `.env` (copy `.env.example`) and fill in:
   ```
   DATABASE_URL="postgresql://...your Neon connection string..."
   AUTH_SECRET="any long random text"
   SEED_ADMIN_EMAIL="code.7motors@gmail.com"
   SEED_ADMIN_PASSWORD="choose-a-strong-password"
   ```
3. Open a terminal in this folder and run:
   ```
   npm install
   npm run setup      # creates all tables in Neon and the first admin account
   npm run dev        # open http://localhost:3000
   ```
4. Sign in with the admin email and password from `.env`, then change the password in User Management.

Optional: `npm run db:seed -- --demo` adds sample cars, customers and bookings for practice (use only on a test database).

## Deploy (Vercel)

1. Push this repo to GitHub.
2. On vercel.com → **Add New Project** → import the repo.
3. Add the environment variables `DATABASE_URL` and `AUTH_SECRET` (same as `.env`).
4. Deploy. Run `npm run setup` once from your computer (with the same `DATABASE_URL`) if you have not already.

## Business rules (from the PRD)

- Rent = daily rate × days, or 12-hour rate × shifts (rounded up), plus driver amount. A manual total needs a reason.
- A car or driver cannot be double-booked for overlapping times.
- Pending = total + late fine − payments. Damage charges are billed separately.
- Late fine = time past the end (after the grace period in Settings) charged in 12 h or 24 h units; editable.
- Car status is worked out live: Rented, Reserved, Return (due back / overdue), Maintenance, Available.
- Investor payable = booking revenue of their cars × share % − maintenance of those cars.
- Profit = (bookings + fines + damage) − (expenses + maintenance).

## Project layout

```
src/app/admin/*      admin pages (one folder per module, actions.ts = server logic)
src/app/portal/*     customer portal
src/app/api/*        file download, availability check, CSV export
src/db/schema.ts     database tables
src/lib/calc.ts      business calculations (rent, fines, balances, investor & driver ledgers)
scripts/seed.ts      first admin account + default lists
```
