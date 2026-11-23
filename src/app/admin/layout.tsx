import Link from 'next/link';
import { Bell, Languages, LogOut } from 'lucide-react';
import { requireUser, getPerms } from '@/lib/auth';
import { getLang } from '@/lib/prefs';
import { EN, t } from '@/lib/i18n';
import { MODULE_KEYS, MODULES } from '@/lib/modules';
import { CommandPalette, type PaletteItem } from '@/components/CommandPalette';
import { getNotifications } from '@/lib/notifications';
import { getSetting } from '@/lib/calc';
import Sidebar from '@/components/Sidebar';
import VoiceButton from '@/components/VoiceButton';
import UploadCompressor from '@/components/UploadCompressor';
import { DropdownCloser } from '@/components/client';
import { toggleLang } from '../prefs-actions';
import { logout } from '../login/actions';

export const dynamic = 'force-dynamic';

const TONE = { red: 'bg-bad', amber: 'bg-warn', blue: 'bg-info', green: 'bg-ok' } as const;
const ICON = { size: 18, strokeWidth: 1.5 } as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const perms = await getPerms(user.role);
  const lang = getLang();
  const labels = Object.fromEntries(Object.keys(EN).map((k) => [k, t(lang, k)]));
  const allowed = MODULE_KEYS.filter((m) => perms[m].view);
  const [notes, business] = await Promise.all([getNotifications(), getSetting('business_name', 'Seven Motors')]);
  const role = user.role.charAt(0) + user.role.slice(1).toLowerCase();
  const CREATE: { mod: (typeof MODULE_KEYS)[number]; label: string; href: string; icon: string }[] = [
    { mod: 'bookings', label: 'New booking', href: '/admin/bookings/new', icon: 'CalendarPlus' },
    { mod: 'cars', label: 'Add car', href: '/admin/cars?new=1', icon: 'CarFront' },
    { mod: 'customers', label: 'Add customer', href: '/admin/customers?new=1', icon: 'UserPlus' },
    { mod: 'receiving', label: 'Receive a returned car', href: '/admin/receiving', icon: 'PackageCheck' },
    { mod: 'expenses', label: 'Add expense', href: '/admin/expenses?new=1', icon: 'ReceiptText' },
    { mod: 'maintenance', label: 'Log maintenance', href: '/admin/maintenance?new=1', icon: 'Wrench' },
    { mod: 'drivers', label: 'Add driver', href: '/admin/drivers?new=1', icon: 'IdCard' },
  ];
  const palette: PaletteItem[] = [
    ...CREATE.filter((c) => perms[c.mod].create).map((c) => ({ label: c.label, href: c.href, group: 'Create' as const, icon: c.icon })),
    ...MODULES.filter((m) => allowed.includes(m.key)).map((m) => ({ label: labels[m.key], href: m.href, group: 'Go to' as const, icon: m.icon })),
  ];

  return (
    <div className="flex min-h-screen bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-navy-dark focus:shadow-float">Skip to main content</a>
      <Sidebar allowed={allowed} labels={labels} business={business} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header data-surface="dark" className="no-print sticky top-0 z-30 flex h-16 items-center justify-end gap-1 bg-navy-dark pe-4 ps-16 text-white shadow-[0_1px_0_rgba(255,255,255,0.08)] md:pe-6 lg:ps-6">
          <CommandPalette items={palette} />
          <details data-dropdown className="group relative">
            <summary
              className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-white/75 transition-colors duration-150 hover:bg-white/10 hover:text-white [&::-webkit-details-marker]:hidden"
              aria-label={`${labels.notifications}${notes.length ? `, ${notes.length}` : ''}`}
            >
              <Bell {...ICON} />
              {notes.length > 0 && (
                <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bad px-1 font-mono text-[10px] font-medium leading-none text-white">
                  {notes.length}
                </span>
              )}
            </summary>
            <div data-surface="light" className="fixed inset-x-2 top-16 mt-1 max-h-[70vh] overflow-y-auto rounded-xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-auto sm:mt-2 sm:w-[22rem] border border-line bg-panel p-1.5 text-ink shadow-modal">
              <p className="px-3 pb-1 pt-2 text-[13px] font-medium text-ink">{labels.notifications}</p>
              {notes.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">Nothing needs attention</p>}
              {notes.map((n) => (
                <Link key={n.key} href={n.href} className="flex gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-panel2">
                  <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${TONE[n.tone]}`} aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm text-ink">{n.title}</span>
                    <span className="block text-[13px] text-muted">{n.detail}</span>
                  </span>
                </Link>
              ))}
            </div>
          </details>

          <form action={toggleLang}>
            <button className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-white/75 transition-colors duration-150 hover:bg-white/10 hover:text-white" title="English / اردو">
              <Languages {...ICON} className="text-white/50" />
              {lang === 'ur' ? <span lang="en">English</span> : <span lang="ur">اردو</span>}
            </button>
          </form>

          <div className="ms-2 flex items-center gap-2.5 border-s border-white/15 ps-3">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-[13px] font-bold text-navy-dark">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[13px] font-semibold text-white">{user.name}</span>
              <span className="block text-xs text-white/55">{role}</span>
            </span>
            <form action={logout}>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white" title={labels.logout} aria-label={labels.logout}>
                <LogOut {...ICON} />
              </button>
            </form>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full outline-none max-w-[1600px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
      <VoiceButton lang={lang} />
      <UploadCompressor />
      <DropdownCloser />
    </div>
  );
}
