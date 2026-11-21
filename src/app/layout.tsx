import './globals.css';
import type { Metadata } from 'next';
import { getLang, getTheme } from '@/lib/prefs';

export const metadata: Metadata = {
  title: '7 Motors — Car Rental Management',
  description: 'Seven Motors rent-a-car management system',
  icons: { icon: '/logo.jpg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const theme = getTheme();
  return (
    <html lang={lang} dir={lang === 'ur' ? 'rtl' : 'ltr'} className={theme === 'dark' ? 'dark' : ''}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
