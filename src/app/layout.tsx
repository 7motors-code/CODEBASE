import './globals.css';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, Noto_Nastaliq_Urdu } from 'next/font/google';
import { getLang } from '@/lib/prefs';

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });
const urdu = Noto_Nastaliq_Urdu({ subsets: ['arabic'], weight: ['400', '500', '600'], variable: '--font-urdu', display: 'swap' });

export const metadata: Metadata = {
  title: 'Seven Motors — Car Rental Management',
  description: 'Seven Motors rent-a-car management system',
  icons: { icon: '/logo.jpg' },
};

export const viewport: Viewport = { themeColor: '#F8F8F6', colorScheme: 'light' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  return (
    <html lang={lang} dir={lang === 'ur' ? 'rtl' : 'ltr'} className={`${sans.variable} ${mono.variable} ${urdu.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
