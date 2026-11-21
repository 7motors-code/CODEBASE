export const MODULES = [
  { key: 'dashboard', href: '/admin', group: 'overview', icon: 'LayoutGrid' },
  { key: 'cars', href: '/admin/cars', group: 'operations', icon: 'Car' },
  { key: 'bookings', href: '/admin/bookings', group: 'operations', icon: 'CalendarDays' },
  { key: 'receiving', href: '/admin/receiving', group: 'operations', icon: 'PackageCheck' },
  { key: 'maintenance', href: '/admin/maintenance', group: 'operations', icon: 'Wrench' },
  { key: 'damage', href: '/admin/damage', group: 'operations', icon: 'TriangleAlert' },
  { key: 'drivers', href: '/admin/drivers', group: 'people', icon: 'IdCard' },
  { key: 'customers', href: '/admin/customers', group: 'people', icon: 'UserRound' },
  { key: 'users', href: '/admin/users', group: 'people', icon: 'UsersRound' },
  { key: 'investors', href: '/admin/investors', group: 'people', icon: 'HandCoins' },
  { key: 'payments', href: '/admin/payments', group: 'finance', icon: 'CreditCard' },
  { key: 'expenses', href: '/admin/expenses', group: 'finance', icon: 'Receipt' },
  { key: 'reports', href: '/admin/reports', group: 'finance', icon: 'ChartColumn' },
  { key: 'locations', href: '/admin/locations', group: 'system', icon: 'MapPin' },
  { key: 'devRequests', href: '/admin/dev-requests', group: 'system', icon: 'Bug' },
] as const;
export type ModuleKey = (typeof MODULES)[number]['key'];
export const MODULE_KEYS = MODULES.map((m) => m.key) as ModuleKey[];
export const ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'ACCOUNTANT'] as const;
export type Action = 'view' | 'create' | 'edit' | 'delete';

/** Default permission matrix used when a role has no saved row for a module */
export function defaultPerm(role: string, mod: ModuleKey): Record<Action, boolean> {
  const all = { view: true, create: true, edit: true, delete: true };
  const none = { view: false, create: false, edit: false, delete: false };
  if (role === 'ADMIN') return all;
  const ops: ModuleKey[] = ['dashboard', 'cars', 'bookings', 'receiving', 'maintenance', 'damage', 'drivers', 'customers', 'locations', 'devRequests'];
  const fin: ModuleKey[] = ['dashboard', 'payments', 'expenses', 'reports', 'investors'];
  if (role === 'MANAGER') return mod === 'users' ? none : { ...all, delete: mod !== 'investors' };
  if (role === 'STAFF') {
    if (mod === 'payments') return { view: true, create: true, edit: false, delete: false };
    return ops.includes(mod) ? { view: true, create: true, edit: true, delete: false } : none;
  }
  if (role === 'ACCOUNTANT') {
    if (fin.includes(mod)) return { view: true, create: true, edit: true, delete: false };
    return ['bookings', 'customers', 'drivers', 'cars'].includes(mod) ? { ...none, view: true } : none;
  }
  return none;
}
