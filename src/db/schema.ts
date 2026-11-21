import {
  pgTable, serial, text, integer, boolean, timestamp, jsonb, numeric, customType, uniqueIndex, index, date,
} from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => 'bytea' });

const created = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();

// ---------- System ----------
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('STAFF'), // ADMIN | MANAGER | STAFF | ACCOUNTANT | custom
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | INACTIVE
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: created(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  role: text('role').notNull(),
  module: text('module').notNull(),
  canView: boolean('can_view').notNull().default(false),
  canCreate: boolean('can_create').notNull().default(false),
  canEdit: boolean('can_edit').notNull().default(false),
  canDelete: boolean('can_delete').notNull().default(false),
}, (t) => ({ uq: uniqueIndex('role_module_uq').on(t.role, t.module) }));

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const files = pgTable('files', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  data: bytea('data').notNull(),
  createdAt: created(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  userName: text('user_name'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  details: text('details'),
  createdAt: created(),
});

// Login / portal attempt counter used for brute-force protection
export const rateLimits = pgTable('rate_limits', {
  id: serial('id').primaryKey(),
  key: text('key').notNull(),
  createdAt: created(),
}, (t) => ({ keyIdx: index('rate_limits_key_idx').on(t.key, t.createdAt) }));

export const lookups = pgTable('lookups', {
  id: serial('id').primaryKey(),
  kind: text('kind').notNull(), // CAR_CATEGORY | MAINT_TYPE | DAMAGE_TYPE | EXPENSE_CATEGORY | BOOKING_TYPE
  name: text('name').notNull(),
}, (t) => ({ uq: uniqueIndex('lookup_uq').on(t.kind, t.name) }));

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city'),
  address: text('address'),
  active: boolean('active').notNull().default(true),
  createdAt: created(),
});

// ---------- People ----------
export const investors = pgTable('investors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  cnic: text('cnic'),
  address: text('address'),
  bankDetails: text('bank_details'),
  sharePercent: numeric('share_percent', { precision: 5, scale: 2 }).notNull().default('50'),
  createdAt: created(),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey(), // C20261118075214C8C8
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  cnic: text('cnic'),
  cnicFrontId: text('cnic_front_id'),
  cnicBackId: text('cnic_back_id'),
  address: text('address'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | BLOCKED
  blockReason: text('block_reason'),
  isCredit: boolean('is_credit').notNull().default(false),
  creditLimit: integer('credit_limit').notNull().default(0),
  createdAt: created(),
});

export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age'),
  cnic: text('cnic'),
  licenseNo: text('license_no'),
  licenseExpiry: date('license_expiry'),
  phone: text('phone'),
  photoId: text('photo_id'),
  paymentBasis: text('payment_basis').notNull().default('PER_BOOKING'), // PER_BOOKING | SALARY
  perDayFee: integer('per_day_fee').notNull().default(0),
  monthlySalary: integer('monthly_salary').notNull().default(0),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: created(),
});

// ---------- Fleet ----------
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  model: text('model').notNull(),
  chassisNo: text('chassis_no'),
  regNo: text('reg_no').notNull().unique(),
  color: text('color'),
  category: text('category').notNull(),
  rateDay: integer('rate_day').notNull(),
  rate12h: integer('rate_12h').notNull(),
  meterReading: integer('meter_reading').notNull().default(0),
  photoId: text('photo_id'),
  cardPhotoId: text('card_photo_id'),
  investorId: integer('investor_id'),
  active: boolean('active').notNull().default(true),
  createdAt: created(),
});

// ---------- Bookings ----------
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(), // BK-20261118080847-70CE
  groupId: text('group_id'), // GRP-20261117115524
  customerId: text('customer_id').notNull(),
  vehicleId: integer('vehicle_id').notNull(),
  driverId: integer('driver_id'),
  locationId: integer('location_id'),
  bookingType: text('booking_type'),
  durationType: text('duration_type').notNull().default('DAY'), // DAY | 12H
  shift: text('shift'), // DAY | NIGHT
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  fuelOut: text('fuel_out'),
  meterOut: integer('meter_out'),
  rentAmount: integer('rent_amount').notNull().default(0),
  driverAmount: integer('driver_amount').notNull().default(0),
  totalAmount: integer('total_amount').notNull().default(0),
  advanceAmount: integer('advance_amount').notNull().default(0),
  status: text('status').notNull().default('CONFIRMED'), // PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED
  source: text('source').notNull().default('ADMIN'), // ADMIN | PORTAL
  guarantorName: text('guarantor_name'),
  guarantorPhone: text('guarantor_phone'),
  guarantorCnic: text('guarantor_cnic'),
  guarantorCnicId: text('guarantor_cnic_id'),
  guarantorAddress: text('guarantor_address'),
  signatureId: text('signature_id'),
  thumbId: text('thumb_id'),
  overrideReason: text('override_reason'),
  notes: text('notes'),
  createdById: integer('created_by_id'),
  createdAt: created(),
});

export const receivings = pgTable('receivings', {
  id: serial('id').primaryKey(),
  bookingId: text('booking_id').notNull().unique(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  meterIn: integer('meter_in'),
  fuelIn: text('fuel_in'),
  notes: text('notes'),
  photoIds: jsonb('photo_ids').$type<string[]>().notNull().default([]),
  fine: integer('fine').notNull().default(0),
  fineNote: text('fine_note'),
  receivedById: integer('received_by_id'),
  createdAt: created(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(), // PAY-...
  bookingId: text('booking_id'),
  damageId: text('damage_id'),
  customerId: text('customer_id'),
  amount: integer('amount').notNull(),
  type: text('type').notNull(), // ADVANCE | RENT | FINE | DAMAGE
  method: text('method').notNull().default('Cash'),
  reference: text('reference'),
  note: text('note'),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
  receivedById: integer('received_by_id'),
  createdAt: created(),
});

// ---------- Fleet care ----------
export const maintenance = pgTable('maintenance', {
  id: text('id').primaryKey(), // MT-202611181012-AB12
  vehicleId: integer('vehicle_id').notNull(),
  types: jsonb('types').$type<string[]>().notNull().default([]),
  date: date('date').notNull(),
  cost: integer('cost').notNull().default(0),
  meterReading: integer('meter_reading'),
  nextOilChangeKm: integer('next_oil_change_km'),
  status: text('status').notNull().default('SCHEDULED'), // SCHEDULED | IN_PROGRESS | COMPLETED
  notes: text('notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: created(),
});

export const damages = pgTable('damages', {
  id: text('id').primaryKey(), // DMG-...
  bookingId: text('booking_id').notNull(),
  vehicleId: integer('vehicle_id').notNull(),
  customerId: text('customer_id').notNull(),
  damageType: text('damage_type').notNull(),
  description: text('description'),
  mediaIds: jsonb('media_ids').$type<string[]>().notNull().default([]),
  estimatedCost: integer('estimated_cost').notNull().default(0),
  status: text('status').notNull().default('PENDING'), // PENDING | PAID | WAIVED
  createdAt: created(),
});

// ---------- Finance ----------
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(), // EXP-...
  date: date('date').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  amount: integer('amount').notNull(),
  method: text('method').default('Cash'),
  receiptId: text('receipt_id'),
  source: text('source').notNull().default('MANUAL'), // MANUAL | DRIVER | INVESTOR
  createdAt: created(),
});

export const driverPayments = pgTable('driver_payments', {
  id: serial('id').primaryKey(),
  driverId: integer('driver_id').notNull(),
  amount: integer('amount').notNull(),
  date: date('date').notNull(),
  method: text('method').default('Cash'),
  note: text('note'),
  expenseId: text('expense_id'),
  createdAt: created(),
});

export const investorPayouts = pgTable('investor_payouts', {
  id: serial('id').primaryKey(),
  investorId: integer('investor_id').notNull(),
  month: text('month').notNull(), // YYYY-MM
  revenue: integer('revenue').notNull(),
  share: integer('share').notNull(),
  maintenance: integer('maintenance').notNull(),
  payable: integer('payable').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
  expenseId: text('expense_id'),
}, (t) => ({ uq: uniqueIndex('payout_uq').on(t.investorId, t.month) }));

// ---------- Support ----------
export const devRequests = pgTable('dev_requests', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('MEDIUM'),
  status: text('status').notNull().default('OPEN'), // OPEN | IN_PROGRESS | DONE
  screenshotId: text('screenshot_id'),
  createdByName: text('created_by_name'),
  createdAt: created(),
});

export const devReplies = pgTable('dev_replies', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull(),
  message: text('message').notNull(),
  authorName: text('author_name'),
  createdAt: created(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Investor = typeof investors.$inferSelect;
