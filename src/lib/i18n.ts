export type Lang = 'en' | 'ur';

const ur: Record<string, string> = {
  // groups
  overview: 'جائزہ', operations: 'آپریشنز', people: 'افراد', finance: 'مالیات', system: 'سسٹم',
  // modules
  dashboard: 'ڈیش بورڈ', cars: 'گاڑیوں کا انتظام', bookings: 'بکنگز', receiving: 'گاڑی کی واپسی', maintenance: 'مینٹیننس',
  damage: 'کسٹمر ڈیمیج', drivers: 'ڈرائیورز', customers: 'کریڈٹ کسٹمر', users: 'یوزر مینجمنٹ', investors: 'انویسٹرز',
  payments: 'ادائیگیاں', expenses: 'اخراجات', reports: 'رپورٹس', locations: 'مقامات', devRequests: 'ڈیولپر درخواستیں',
  switchToCustomer: 'کسٹمر ویو', adminPanel: 'ایڈمن پینل', logout: 'لاگ آؤٹ', notifications: 'اطلاعات',
  // common
  search: 'تلاش کریں', add: 'شامل کریں', save: 'محفوظ کریں', cancel: 'منسوخ', edit: 'ترمیم', delete: 'حذف', view: 'دیکھیں',
  actions: 'کارروائیاں', status: 'حیثیت', total: 'کل', pending: 'باقی', paid: 'ادا شدہ', amount: 'رقم', date: 'تاریخ',
  from: 'سے', to: 'تک', apply: 'لاگو کریں', print: 'پرنٹ', previous: 'پچھلا', next: 'اگلا', noRecords: 'کوئی ریکارڈ نہیں',
  name: 'نام', phone: 'فون', cnic: 'شناختی کارڈ', address: 'پتہ', email: 'ای میل', vehicle: 'گاڑی', customer: 'کسٹمر',
  driver: 'ڈرائیور', location: 'مقام', duration: 'دورانیہ', welcome: 'بیڑا، بکنگز اور آمدنی ایک نظر میں',
  bookingRevenue: 'بکنگ آمدنی', activeBookings: 'فعال بکنگز', registeredCustomers: 'رجسٹرڈ کسٹمرز', fleetStatus: 'بیڑے کی صورتحال',
  revenueOverview: 'آمدنی کا جائزہ', recentBookings: 'حالیہ بکنگز', viewAll: 'سب دیکھیں', available: 'دستیاب', rented: 'کرائے پر',
  reserved: 'محفوظ', return: 'واپسی', addNewCar: 'نئی گاڑی شامل کریں', createBooking: 'بکنگ بنائیں', totalRevenue: 'کل آمدنی',
  totalExpenses: 'کل اخراجات', totalProfit: 'کل منافع', cashSales: 'نقد فروخت', login: 'لاگ ان', password: 'پاس ورڈ',
};

export function t(lang: Lang, key: string, en?: string) {
  if (lang === 'ur' && ur[key]) return ur[key];
  return en ?? EN[key] ?? key;
}

export const EN: Record<string, string> = {
  overview: 'Overview', operations: 'Operations', people: 'People', finance: 'Finance', system: 'System',
  dashboard: 'Dashboard', cars: 'Cars', bookings: 'Bookings', receiving: 'Returns', maintenance: 'Maintenance',
  damage: 'Damage', drivers: 'Drivers', customers: 'Customers', users: 'Users & settings', investors: 'Investors',
  payments: 'Payments', expenses: 'Expenses', reports: 'Reports', locations: 'Locations', devRequests: 'Requests & leads',
  switchToCustomer: 'Customer portal', adminPanel: 'Office', logout: 'Log out', notifications: 'Notifications',
  search: 'Search', add: 'Add', save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', view: 'View',
  actions: 'Actions', status: 'Status', total: 'Total', pending: 'Pending', paid: 'Paid', amount: 'Amount', date: 'Date',
  from: 'From', to: 'To', apply: 'Apply', print: 'Print', previous: 'Previous', next: 'Next', noRecords: 'No records found',
  name: 'Name', phone: 'Phone', cnic: 'CNIC', address: 'Address', email: 'Email', vehicle: 'Vehicle', customer: 'Customer',
  driver: 'Driver', location: 'Location', duration: 'Duration', welcome: 'Fleet, bookings and revenue at a glance',
  bookingRevenue: 'Booking revenue this month', activeBookings: 'Active bookings', registeredCustomers: 'Customers', fleetStatus: 'Fleet today',
  revenueOverview: 'Booking revenue, last 12 months', recentBookings: 'Latest bookings', viewAll: 'View all', available: 'Available', rented: 'Rented',
  reserved: 'Reserved', return: 'Return', addNewCar: 'Add car', createBooking: 'New booking', totalRevenue: 'Total revenue',
  totalExpenses: 'Total expenses', totalProfit: 'Total profit', cashSales: 'Cash sales', login: 'Login', password: 'Password',
};
