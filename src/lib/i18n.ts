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
  driver: 'ڈرائیور', location: 'مقام', duration: 'دورانیہ', welcome: 'خوش آمدید! آج آپ کے بیڑے کی صورتحال یہ ہے۔',
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
  dashboard: 'Dashboard', cars: 'Car Management', bookings: 'Bookings', receiving: 'Vehicle Receiving', maintenance: 'Maintenance',
  damage: 'Customer Damage', drivers: 'Drivers', customers: 'Credit Customer', users: 'User Management', investors: 'Investors',
  payments: 'Payments', expenses: 'Expense', reports: 'Reports', locations: 'Locations', devRequests: 'Dev Requests',
  switchToCustomer: 'Switch to Customer', adminPanel: 'ADMIN PANEL', logout: 'Logout', notifications: 'Notifications',
  search: 'Search', add: 'Add', save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', view: 'View',
  actions: 'Actions', status: 'Status', total: 'Total', pending: 'Pending', paid: 'Paid', amount: 'Amount', date: 'Date',
  from: 'From', to: 'To', apply: 'Apply', print: 'Print', previous: 'Previous', next: 'Next', noRecords: 'No records found',
  name: 'Name', phone: 'Phone', cnic: 'CNIC', address: 'Address', email: 'Email', vehicle: 'Vehicle', customer: 'Customer',
  driver: 'Driver', location: 'Location', duration: 'Duration', welcome: "Welcome back! Here's what's happening with your fleet today.",
  bookingRevenue: 'Booking Revenue', activeBookings: 'Active Bookings', registeredCustomers: 'Registered Customers', fleetStatus: 'Fleet Status',
  revenueOverview: 'Revenue Overview', recentBookings: 'Recent Bookings', viewAll: 'View all', available: 'Available', rented: 'Rented',
  reserved: 'Reserved', return: 'Return', addNewCar: 'Add New Car', createBooking: 'Create Booking', totalRevenue: 'Total Revenue',
  totalExpenses: 'Total Expenses', totalProfit: 'Total Profit', cashSales: 'Cash Sales', login: 'Login', password: 'Password',
};
