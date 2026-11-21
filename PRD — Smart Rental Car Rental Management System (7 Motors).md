# PRD — Smart Rental: Car Rental Management System (7 Motors)

Nov 20, 2026 · @Muddasir Haider Khan

## 1. Overview

The product is a web-based car rental management system for a rent-a-car business in Pakistan. One admin panel covers fleet, bookings, vehicle returns, maintenance, damage claims, drivers, customers, investors, payments, expenses and reports. It is a replica of the "Smart Rental" demo (shown branded as "ali motors" / "Sultan Motors"), rebuilt for the client.

| Item | Detail |
| --- | --- |
| Product name (working) | Smart Rental — 7 Motors edition |
| Product type | Multi-module web app (admin panel + customer portal) |
| Market | Rent-a-car businesses in Pakistan; currency PKR |
| Languages | English and Urdu (toggle in header) |
| Reference | Demo video "overall demo.mp4" (4 min 19 s), reviewed screen by screen, with the Urdu narration translated |
| Document status | Draft v1.0 for client review |

**Problem.** Rental offices track cars, bookings, driver pay, investor shares and damage claims on paper, WhatsApp and spreadsheets. Money leaks through unpaid balances, unbilled damage and wrong investor payouts.

**Solution.** One system where every booking flows from creation to vehicle return to payment, and every rupee of revenue, expense and investor share is calculated automatically.

**What the demo narration adds.** The presenter (speaking Urdu) explains each module as it is shown. Points that go beyond the screens:

- **Positioning:** a fully paperless, single-platform system — "handle everything from here".
- **Dashboard:** pick any date to see which cars are available that day and which are due to come back that day.
- **Bookings:** fuel level and similar trip fields are optional; "Print & Add" prints the **rental paper** (rental agreement) handed to the customer.
- **Vehicle Receiving:** find the booking by booking ID, phone number, CNIC or car plate number; all booking details then appear.
- **Maintenance:** pick the car, record the work done and its cost; mark it complete when finished.
- **Drivers:** added per booking or on salary, and attached to bookings.
- **Credit Customer:** customers who take cars on a **monthly basis and clear their payment after a month** (account customers).
- **Investors:** each investor's cars and an account book (ledger) of what they are owed.
- **Payments:** every booking's payments, plus which vehicles were damaged (damage income).
- **Expense:** staff salaries, office rent and other running costs.
- **Reports:** total revenue, total expenses, profit, cash and pending amounts, plus counts of cars, drivers and cars in maintenance.

## 2. Goals, scope and users

### Goals

1. Run every booking from creation to return in the system, with no paper forms.
2. Show the owner live revenue, pending balances and fleet status on one dashboard.
3. Calculate investor payouts and driver pay automatically, with the formula shown.
4. Bill customers for damage and late returns, with photo evidence.
5. Work in English and Urdu on desktop, tablet and mobile.

### In scope (v1)

All 16 modules seen in the demo: Dashboard, Car Management, Bookings, Vehicle Receiving, Maintenance, Customer Damage, Drivers, Credit Customer, User Management, Investors, Payments, Expense, Reports, Locations, Dev Requests, and the Customer view ("Switch to Customer").

### Out of scope (v1)

- Online card payments for customers (cash/bank recorded manually)
- GPS tracking of vehicles
- Native mobile apps (the web app must be responsive instead)

### Users and roles

| Role | Who | Access |
| --- | --- | --- |
| Super Admin / Owner | Business owner | Everything, including reports, investors, users, settings |
| Manager / Staff | Front-desk and operations staff | Cars, bookings, receiving, maintenance, damage, customers; finance views as permitted |
| Accountant | Finance staff | Payments, expenses, reports, investor payouts |
| Customer | Renter | Customer portal: browse cars, own bookings, payments |
| Developer (support) | Vendor team | Receives Dev Requests raised by the admin |

Permissions are set per role in User Management (see 4.9).

## 3. Global layout and shared features

Every admin page shares one shell: a left sidebar, a top header, and a floating voice button.

### Sidebar navigation (collapsible)

| Group | Menu items |
| --- | --- |
| Overview | Dashboard |
| Operations | Car Management, Bookings, Vehicle Receiving, Maintenance, Customer Damage |
| People | Drivers, Credit Customer, User Management, Investors |
| Finance | Payments, Expense, Reports |
| System | Locations, Dev Requests |
| Footer | Switch to Customer |

- Business logo and name at the top (e.g. "ali motors") with an "ADMIN PANEL" badge. Logo and name are configurable per client.
- Active item is highlighted with a gradient pill. A collapse arrow shrinks the sidebar to icons.

### Header (every page)

- Page title and "Admin Panel" subtitle on the left.
- Notification bell with an unread-count badge.
- Language toggle (اردو / English): switches all labels to Urdu with right-to-left layout.
- Theme toggle: dark theme (default, as in demo) and light theme.
- Profile chip showing user name and email, with logout.

### Shared components

- **Floating voice (mic) button**, bottom right on every page. Assumed purpose: voice search / voice commands to fill forms. To confirm with client (see open questions).
- **KPI cards** at the top of most modules, each with a count/amount and status badge.
- **Data tables** with search box, filters, date range, status tabs, pagination (Previous / page / Next), "Showing x to y of z entries", and row actions (view, edit, delete).
- **Modal forms** for Add/Edit, with required fields marked \*, Cancel and Add buttons.
- **Searchable dropdowns** (e.g. vehicle picker shows model + plate number).
- **Footer**: copyright line with vendor name.
- All amounts in PKR with thousands separators; dates dd/mm/yyyy.

## 4. Functional requirements by module

Each module below lists what the demo shows, then the requirements to build. IDs (e.g. CAR-03) are for tracking in development and testing.

### 4.1 Dashboard

The landing page after login: a live summary of the business today.

| ID | Requirement |
| --- | --- |
| DSH-01 | Greeting: "Welcome back! Here's what's happening with your fleet today." |
| DSH-02 | KPI cards: Booking Revenue (PKR), Active Bookings (count), Registered Customers (count), each with % change vs last month (green up / red down). |
| DSH-03 | Revenue Overview line chart: monthly revenue and booking trend for the last 12 months (Dec–Nov), with total shown in a badge (e.g. PKR 2,961,670). |
| DSH-04 | Fleet Status donut chart: total vehicles in centre, split into Available, Rented, Maintenance, Reserved, with counts in a legend. |
| DSH-05 | Vehicle Fleet Status panel: shows date (e.g. "Friday, November 27th, 2026"), vehicle search box, date picker, refresh button. |
| DSH-06 | Month calendar beside the vehicle list; picking a day shows each vehicle's status on that day, including which cars are available and which are due back that day. |
| DSH-07 | Vehicles list (with count badge): Vehicle name, Registration Number, Rate (PKR per day), Status badge (Available green, Booked red, Return red/purple, Maintenance). |
| DSH-08 | Recent Bookings table: Booking ID (link), Customer (avatar + name), Vehicle (model + plate), Duration (date range), Status badge (Pending, Confirmed, etc.), Amount; "View all" goes to Bookings. |
| DSH-09 | All figures refresh on page load; data visible depends on the user's role. |

### 4.2 Car Management

Fleet register: add, view, edit and delete vehicles, with pricing and availability.

| ID | Requirement |
| --- | --- |
| CAR-01 | KPI cards: Total Vehicles, Available, Booked, Maintenance. |
| CAR-02 | Search by model or registration number; Filters (category, status, colour, price range). |
| CAR-03 | Table columns: Vehicle (thumbnail photo + name), Category, Reg. Number, Color, Daily Rate (PKR x/day), Status badge, Actions (view, edit, delete). |
| CAR-04 | "Add New Car" button opens the Add Vehicle form (CAR-05). Edit uses the same form pre-filled. |
| CAR-05 | Add Vehicle form — Vehicle details: Vehicle model\* (e.g. Corolla 2023), Chassis no (optional), Registration Number\* (e.g. LEA-1234), Car Color, Category\* (dropdown: Sedan, SUV, Hatchback, etc.). |
| CAR-06 | Pricing & meter: Vehicle price per day\* (PKR), 12-hours vehicle price\* (PKR), Meter reading (km). |
| CAR-07 | Photos: Vehicle photo\* (main image), Car Card photo (image shown on cards / customer portal). Upload with preview. |
| CAR-08 | Status values: Available, Booked/Rented, Reserved, Return (awaiting receiving), Maintenance. Status changes automatically from bookings, receiving and maintenance. |
| CAR-09 | Optional: link vehicle to an Investor (owner) for profit sharing (see 4.10). |
| CAR-10 | Delete asks for confirmation; a car with active bookings cannot be deleted (only deactivated). |
| CAR-11 | Vehicle detail view: photos, specs, current meter, booking history, maintenance history, damage history, revenue earned. |

### 4.3 Bookings (Booking Management)

Create and manage all rental bookings. This is the core module.

**List screen**

| ID | Requirement |
| --- | --- |
| BKG-01 | KPI cards: Pending, Confirmed, In Progress, Completed (counts with matching coloured badges). |
| BKG-02 | Search by Booking ID, customer or vehicle; Date Range picker; Filters. |
| BKG-03 | Status tabs with counts: All, Pending, Confirmed, In Progress, Completed, Cancelled. |
| BKG-04 | Table columns: Booking ID, Customer, Vehicle, Driver, Location, Duration, Status, Total Amount, Pending Amount, Action (view, edit, print, cancel). |
| BKG-05 | Pagination with page numbers. |

**Create Booking form** (modal, scrolling, sections in this order)

| ID | Section | Fields |
| --- | --- | --- |
| BKG-10 | Header | Booking ID — auto-generated, read-only (format BK-YYYYMMDDHHMMSS-XXXX, e.g. BK-20261118080847-70CE). Group bookings use GRP-YYYYMMDDHHMMSS. |
| BKG-11 | Customer details | Customer name\* with lookup button to pick an existing customer (auto-fills the rest); Customer phone\* (with country code); Customer ID card\* (CNIC, mask 00000-0000000-0); CNIC Front side and Back side image upload; Customer address. |
| BKG-12 | Guarantor details | Guarantor name, Guarantor phone no, Guarantor CNIC (with upload), Guarantor address. |
| BKG-13 | Verification | Customer Signature (upload image or draw); Customer Thumb Impression ("Scan Thumb" button for a USB fingerprint scanner). |
| BKG-14 | Vehicle & trip | Vehicle (searchable, multi-select — selecting several cars creates a group booking, one booking per car); Fuel level (optional: Empty, 1/4, 1/2, 3/4, Full); Meter reading (out); Booking type (e.g. Self-drive / With driver / Out-of-city); Booking shift (Day / Night — only for 12-hour duration); Location (city/area, from Locations list). |
| BKG-15 | Driver | Driver name (dropdown from Drivers; optional); Driver amount (PKR); Driver Duration (Per day / 12 hours). |
| BKG-16 | Schedule | Duration type (Per day / 12 hours); Start date + Start time; End date + End time. |
| BKG-17 | Payment | Advance Amount; Total Amount (auto-calculated from rate × duration + driver amount, editable). Pending Amount = Total − Advance. |
| BKG-18 | Buttons | Cancel; Print & Add (saves and prints the rental agreement/receipt); Add. |

**Rules**

- BKG-20: A vehicle cannot be double-booked for overlapping dates; the picker shows only cars free for the chosen period.
- BKG-21: On save, the car's status becomes Reserved (future start) or Rented (start now).
- BKG-22: Status flow: Pending → Confirmed → In Progress → Completed, or Cancelled. Completion happens through Vehicle Receiving.
- BKG-23: A new customer entered in the form is saved to the Customer list automatically.
- BKG-24: Printed agreement shows company logo, customer and guarantor details, CNIC images, car, meter/fuel out, dates, amounts, terms, signature and thumb.

### 4.4 Vehicle Receiving

Check-in of a returned car against its booking.

| ID | Requirement |
| --- | --- |
| RCV-01 | Search Booking box accepting Booking ID, phone, CNIC, car name or plate no, with live suggestions (e.g. GRP-20261117115524). |
| RCV-02 | Selecting a booking shows its details: customer, car, out date/time, meter out, fuel out, amounts paid and pending. |
| RCV-03 | Receiving form: return date/time, meter in, fuel in, condition notes, photos. |
| RCV-04 | Fine calculation: late-return hours charged at the hourly/12-hour/daily rate, extra km if a limit is set, fuel shortfall; admin can edit the fine. |
| RCV-05 | Option to raise a damage report directly (goes to Customer Damage). |
| RCV-06 | Collect remaining payment; on save the booking becomes Completed, the car becomes Available, and the car's meter reading updates. |
| RCV-07 | Received Vehicles table: Booking ID, Customer, Vehicle, Received At, Fine, Actions (view, print receipt); paginated. |

### 4.5 Maintenance (Maintenance Expenses)

Record and track vehicle maintenance and its cost.

| ID | Requirement |
| --- | --- |
| MNT-01 | KPI cards: Overdue (red), In Progress, Scheduled, Completed (e.g. 26). |
| MNT-02 | Search by vehicle, reg no, type or status. |
| MNT-03 | Table columns: ID (auto, format MT-YYYYMMDDHHMM-XXXX), Vehicle (name + plate), Type (one or more, e.g. "Brakes, tuning"), Scheduled Date, Status badge, Cost (PKR), Action. |
| MNT-04 | Row actions: "Send to work shop" (status → In Progress, car → Maintenance), "Mark complete" (status → Completed, car → Available), edit, delete. |
| MNT-05 | Add Maintenance Expense form: Vehicle (searchable, shows model + plate); Current Meter Reading (auto-shown after vehicle is picked); Maintenance type (dropdown, multi-select: Oil change, Tuning, Brakes, Battery, Tyres, Service, Body work, Other — admin can add types); Maintenance Date; Cost (PKR); Next Oil Change (km). |
| MNT-06 | Status auto-rules: date in future → Scheduled; date passed and not complete → Overdue. |
| MNT-07 | Oil-change reminder: when a car's meter reaches the "Next Oil Change" km, raise a notification. |
| MNT-08 | Maintenance cost of an investor's car is deducted from the investor's share (see 4.10). |

### 4.6 Customer Damage

Log damage caused by a customer, attach evidence, and bill it.

| ID | Requirement |
| --- | --- |
| DMG-01 | Log New Incident: Select Booking (search by booking ID / customer name / phone / CNIC); Damage Type (type to search or "+" to add new, e.g. Scratch, Dent, Glass, Tyre, Accident); Detailed Description. |
| DMG-02 | Evidence Upload: multiple photos/videos of the damage. |
| DMG-03 | Cost Estimation: Estimated Repair Cost (PKR); Total Payable by Customer shown live. |
| DMG-04 | "Submit Damage Report" saves it, adds the amount to the customer's pending balance, and links it to the booking and car. |
| DMG-05 | Damage History table: Date, Time, Vehicle, Customer Name, Damage Type, Status (Pending / Paid / Waived), Amount, Actions (view, edit, collect payment, print); search by car reg no, name or customer. |
| DMG-06 | Damage revenue is tracked separately in Payments ("Damage Revenue (separate)"). |

### 4.7 Drivers (Driver Management)

Driver profiles, licences and payments.

| ID | Requirement |
| --- | --- |
| DRV-01 | Driver cards grid with search: photo, availability badge (Available / On trip), name, licence no, payment basis badge (Salary Basis / Per Booking), phone. |
| DRV-02 | Each card shows Per Day Fee and a ledger: Total earned, Paid, Pending (PKR), plus a "Pay" button, view, edit, delete. |
| DRV-03 | Add Driver form: Driver name, Age, ID card (CNIC), License no, Phone no, Payment basis (Per Booking — paid for each trip / Salary Basis — fixed monthly salary), Per day fee amount (or monthly salary), photo. |
| DRV-04 | Per-booking drivers earn the driver amount of every booking assigned to them; salaried drivers accrue their monthly salary. |
| DRV-05 | "Pay" records a payout (amount, date, method, note), reduces Pending, and posts to Expenses under "Salaries / Driver pay". |
| DRV-06 | Driver detail view: trip history, payment history, licence expiry reminder. |
| DRV-07 | A driver cannot be assigned to two bookings with overlapping times. |

### 4.8 Credit Customer (Customer Management)

Credit customers are account clients (often companies) who take cars on a monthly basis and clear their payment at month end. This module holds all customer profiles, booking history and running balances.

| ID | Requirement |
| --- | --- |
| CUS-01 | Search by Customer ID, name or phone. |
| CUS-02 | Table columns: Customer ID (auto, format C + timestamp + code, e.g. C20261118075214C8C8), Name, Email, Phone, Status (Active / Blocked), Bookings (count), Address, Registered date, Actions. |
| CUS-03 | Clicking a row opens a profile panel on the right: avatar, name, Active badge, ID; tabs Overview and Activity; edit and more (⋮) menu. |
| CUS-04 | Overview tab: Email, Phone, CNIC, Address, Joined date, Total Paid (green) and Pending (red) amounts. |
| CUS-05 | Activity tab: timeline of bookings, payments, damage reports and messages. |
| CUS-06 | "Credit Customer" button adds a customer manually (name, email, phone, CNIC + images, address, credit limit). |
| CUS-07 | Credit customers book on account through the month: their bookings build up as pending and are billed once at month end through a monthly statement, up to a credit limit. Walk-in customers pay an advance and settle at return. Customers must clear overdue dues before a new booking (configurable). |
| CUS-08 | Block / blacklist a customer with a reason; blocked customers cannot be selected in a new booking. |
| CUS-09 | Empty state: "Select customer — choose a customer from the list to view their profile and complete history." |

### 4.9 User Management

Staff logins and permissions. The menu item appears in the demo but the screen is not shown; requirements below are the standard expectation.

| ID | Requirement |
| --- | --- |
| USR-01 | List users: name, email, phone, role, status, last login. |
| USR-02 | Add / edit / deactivate users; reset password. |
| USR-03 | Roles: Super Admin, Manager, Staff, Accountant (custom roles allowed). |
| USR-04 | Permission matrix per module: view, create, edit, delete. |
| USR-05 | Activity log of who created, edited or deleted each record. |

### 4.10 Investors (Investor Management)

Track investors who own cars in the fleet, and calculate their monthly payout.

| ID | Requirement |
| --- | --- |
| INV-01 | KPI cards: Total Investors, Vehicles Assigned, With Vehicles. |
| INV-02 | Search investors; table columns: Name (avatar initial), Phone, CNIC, Address, Vehicles (chips with model + plate, e.g. "tesla model X (2004)"), Actions (view, edit, delete). |
| INV-03 | Add/Edit Investor: name, phone, CNIC, address, bank details, assigned vehicles (multi-select), profit share % (default 50%). |
| INV-04 | Investor detail (view) shows summary cards: Booking Revenue (full booking total, paid or not); Investor Share (share % of revenue); Maintenance (deducted from investor share, shown negative); Investor Payable (due at month end); Your Revenue (what the office keeps after payout). |
| INV-05 | A "How it's calculated" line shows the formula with real numbers, e.g. PKR 590,000 × 50% − PKR 96,334 = PKR 198,666. |
| INV-06 | Profit by Car: for each car, its status, number of bookings, Revenue, Share (50%), Maintenance, Payable, and a calendar icon to filter by month. |
| INV-07 | Month selector; "Mark as paid" records the payout and posts it to Expenses. |
| INV-08 | Printable / PDF investor statement per month. |

### 4.11 Payments (Payments & Billing)

Every booking's money in one place.

| ID | Requirement |
| --- | --- |
| PAY-01 | KPI cards: Total Revenue, Today's Payments, Pending Payments, Payments Received, Damage Revenue (separate). |
| PAY-02 | "Show Calendar" toggle and From / To date filters. |
| PAY-03 | Search by Booking ID, phone or customer name. |
| PAY-04 | Table columns: Pending Amount, Total Amount, Fine Amount, Paid Amount, Booking ID, Customer, Car (Plate), Location, Status, Date, Actions. |
| PAY-05 | Actions: Receive payment (amount, date, method: Cash / Bank transfer / JazzCash / Easypaisa / Card, reference, note), view payment history, print receipt. |
| PAY-06 | Partial payments allowed; each payment is a separate record; pending recalculates automatically. |

### 4.12 Expense (Expense Overview)

Office expenses besides maintenance.

| ID | Requirement |
| --- | --- |
| EXP-01 | KPI cards: Total Expenses (Rs., with % vs average), Biggest Category (e.g. Salaries, "High impact on monthly cost"), Total Records. |
| EXP-02 | Date Range filter and "Add Expense" button. |
| EXP-03 | Monthly Expenses line chart (last 6 months) and Expense Categories chart (donut/pie). |
| EXP-04 | Recent Expenses table: Date, Expense ID, Description, Category, Amount, Action (edit, delete); paginated. |
| EXP-05 | Add Expense form: date, category (Salaries, Rent, Utilities, Fuel, Driver pay, Investor payout, Marketing, Other — editable list), description, amount, payment method, receipt upload. |

### 4.13 Reports

Daily and period summary for the owner.

| ID | Requirement |
| --- | --- |
| RPT-01 | Header: business name (e.g. Sultan Motors), "Daily summary Report", From and To date pickers, Apply. Default = today. |
| RPT-02 | Coloured KPI tiles: Total Revenue, Total Expenses, Total Profit, Cash Sales, This Month's Sales, Pending Amount, Total Vehicles, Total Drivers, Maintenance Vehicles. |
| RPT-03 | Monthly Revenue vs. Expenses (YTD) chart, two lines, Jan–Dec. |
| RPT-04 | Payment Details table: Pending Amount, Total Amount, Paid Amount, Booking ID, Customer, Car, Location, Status, Date. |
| RPT-05 | Export to PDF and Excel; Print. |
| RPT-06 | Profit = Revenue − Expenses for the chosen period (see section 5). |

### 4.14 Locations

Menu item in the System group (screen not shown in demo). Manage the cities/branches/pickup points used in bookings (e.g. Islamabad, Lahore): name, city, address, active flag. Reports and payments can be filtered by location.

### 4.15 Dev Requests

Menu item in the System group (screen not shown in demo). The admin raises a support or feature request to the software vendor: title, description, screenshot, priority; status Open / In progress / Done, with replies.

### 4.16 Customer portal ("Switch to Customer")

The sidebar link switches to the customer-facing view (not shown in demo; scope to confirm). Expected minimum:

- Browse available cars with card photo, daily and 12-hour price.
- Check availability for dates and send a booking request (lands as Pending in Bookings).
- Customer login (phone OTP or email) to see own bookings, payments, pending dues and damage reports.

### 4.17 Notifications

Bell icon with unread count. Triggers: new booking request, booking starting today, car due back today, overdue return, maintenance overdue, oil change due, payment received, driver licence expiring, month-end investor payout due.

## 5. Key workflows and calculations

### 5.1 Booking lifecycle

&#91;embedded content: booking lifecycle · 6 steps, 1 cancel path\]

A booking moves left to right; it reaches Completed only after the car is received and the full balance (rent, fine, damage) is collected. It can be cancelled any time before hand-over.

### 5.2 Vehicle status rules

| Event | Car status becomes |
| --- | --- |
| Booking saved, start date in future | Reserved |
| Booking start (car handed over) | Rented / Booked |
| Booking end time passed, car not received | Return (overdue alert) |
| Vehicle Receiving saved | Available |
| Maintenance "Send to work shop" | Maintenance |
| Maintenance "Mark complete" | Available |

### 5.3 Calculations

- **Booking total** = (daily rate × days) or (12-hour rate × shifts) + driver amount. Staff can override with a reason.
- **Pending amount** = Total + Fine + Damage − all payments received.
- **Late fine** = extra time beyond end time, charged at the car's 12-hour or daily rate (grace period configurable, e.g. 1 hour).
- **Investor payable (monthly)**, as shown in the demo:

```latex
\text{Payable} = \text{Booking revenue of investor cars} \times \text{Share \%} - \text{Maintenance cost of those cars}
```

- **Office revenue from investor cars** = Booking revenue − Investor payable (demo: 590,000 − 198,666 = 391,334).
- **Driver earnings** = sum of driver amounts on completed bookings (per-booking) or monthly salary (salaried); Pending = Earned − Paid.
- **Profit (Reports)** = Total revenue − Total expenses (maintenance + office expenses + driver pay + investor payouts) for the period.
- **Cash sales** = payments actually received in the period; **Pending** = unpaid balances.

## 6. Data model (main entities)

| Entity | Key fields | Links to |
| --- | --- | --- |
| Vehicle | id, model, chassis\_no, reg\_no (unique), color, category, rate\_day, rate\_12h, meter\_reading, photo, card\_photo, status, investor\_id | Investor, Bookings, Maintenance, Damage |
| Customer | id (C…), name, email, phone, cnic, cnic\_front, cnic\_back, address, status, credit\_limit, joined\_at | Bookings, Payments, Damage |
| Booking | id (BK…/GRP…), group\_id, customer\_id, vehicle\_id, driver\_id, location\_id, booking\_type, duration\_type, shift, start\_at, end\_at, fuel\_out, meter\_out, total, advance, status | Customer, Vehicle, Driver, Guarantor, Payments |
| Guarantor | booking\_id, name, phone, cnic, cnic\_image, address | Booking |
| Booking verification | booking\_id, signature\_image, thumb\_template/image | Booking |
| Receiving | booking\_id, received\_at, meter\_in, fuel\_in, notes, photos, fine | Booking |
| Payment | id, booking\_id, amount, type (rent / fine / damage / advance), method, reference, paid\_at, received\_by | Booking, Customer |
| Maintenance | id (MT…), vehicle\_id, types\[\], date, cost, meter\_reading, next\_oil\_change\_km, status | Vehicle |
| Damage | id, booking\_id, vehicle\_id, customer\_id, damage\_type, description, media\[\], estimated\_cost, status | Booking, Vehicle, Customer |
| Driver | id, name, age, cnic, license\_no, phone, photo, payment\_basis, per\_day\_fee / salary, status | Bookings, Driver payments |
| Driver payment | driver\_id, amount, date, method, note | Driver, Expense |
| Investor | id, name, phone, cnic, address, bank\_details, share\_percent | Vehicles, Investor payouts |
| Investor payout | investor\_id, month, revenue, share, maintenance, payable, paid\_at | Investor, Expense |
| Expense | id, date, category, description, amount, method, receipt | — |
| Location | id, name, city, address, active | Bookings |
| User | id, name, email, phone, role\_id, status, last\_login | Role, Activity log |
| Role / Permission | role, module, can\_view/create/edit/delete | Users |
| Notification, Dev request, Activity log | standard fields | Users |

## 7. Non-functional requirements and technology

| Area | Requirement |
| --- | --- |
| Performance | Pages load in under 2 s on a 4G connection; tables paginate server-side (default 10–20 rows). |
| Devices | Fully responsive: desktop, tablet, mobile. Chrome, Edge, Safari, Firefox (latest 2 versions). |
| Language | English and Urdu, with right-to-left layout for Urdu; all labels in translation files. |
| Theme | Dark (default) and light themes. |
| Security | Login with hashed passwords, role-based access, HTTPS, session timeout, audit log. CNIC images and thumbprints stored privately (not public URLs). |
| Data | Daily automated backups, 30-day retention; soft-delete for bookings, payments and customers. |
| Hardware | USB fingerprint scanner for "Scan Thumb"; receipt / A4 printer for "Print & Add". |
| Multi-tenant (optional) | Branding (logo, business name) configurable so the same build can serve several rental offices. |
| Uptime | 99.5% monthly on a cloud host. |

**Recommended stack** (the demo appears to be a modern JavaScript web app): Next.js / React + Tailwind front end, Node.js (NestJS or Express) API, PostgreSQL database, cloud file storage for images, hosted on a VPS or Vercel + managed database. Charts with Recharts or Chart.js; PDF with a server-side renderer.

## 8. Release plan, acceptance and open questions

### 8.1 Phases

| Phase | Modules | Outcome |
| --- | --- | --- |
| 1 — Core operations | Login, roles, layout, Car Management, Customers, Bookings (with print), Vehicle Receiving, Payments, Locations | Office can run daily rentals end to end |
| 2 — Fleet care and people | Maintenance, Customer Damage, Drivers, Expense, Notifications | Costs, damage and driver pay tracked |
| 3 — Owner insight | Dashboard charts, Investors with payout calculation, Reports with export, Urdu + light theme | Owner sees profit and pays investors from the system |
| 4 — Extras | Customer portal, voice assistant, Dev Requests, fingerprint scanner integration | Customer self-service and advanced features |

### 8.2 Acceptance criteria (summary)

- [ ] A booking can be created, printed, received and fully paid, and the car's status changes correctly at each step.
- [ ] The same car cannot be booked twice for overlapping times.
- [ ] Investor payable for a month matches the formula in 5.3 to the rupee.
- [ ] Dashboard, Payments and Reports totals agree with each other for the same period.
- [ ] Each role sees only the modules its permissions allow.
- [ ] Every screen works in Urdu (RTL) and on a mobile phone.

### 8.3 Open questions for the client

1. Booking types: which options are needed (Self-drive, With driver, Out-of-city, other)?
2. Late-return fine: grace period and rate (hourly, 12-hour or daily)?
3. Is there a daily km limit with an extra-km charge?
4. Investor share: always 50%, or set per investor / per car? Is maintenance always deducted from the investor?
5. Voice (mic) button: what should it do — voice search, voice form filling, or a voice assistant?
6. Fingerprint scanner: which model, if any, will the office use?
7. Customer portal: needed in v1? Should customers be able to pay online?
8. SMS / WhatsApp notifications to customers (booking confirmation, return reminder)?
9. One branch or several branches with separate reports?
10. Branding: business name, logo, colours, and domain name.
