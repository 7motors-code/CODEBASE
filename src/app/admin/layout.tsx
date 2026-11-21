import Link from 'next/link';
import { Bell, Languages, Moon, Sun, LogOut } from 'lucide-react';
import { requireUser, getPerms } from '@/lib/auth';
import { getLang, getTheme } from '@/lib/prefs';
import { EN, t } from '@/lib/i18n';
import { MODULE_KEYS } from '@/lib/modules';
import { getNotifications } from '@/lib/notifications';
import { getSetting } from '@/lib/calc';
import Sidebar from '@/components/Sidebar';
import VoiceButton from '@/components/VoiceButton';
import UploadCompressor from '@/components/UploadCompressor';
import { toggleLang, toggleTheme } from '../prefs-actions';
import { logout } from '../login/actions';

export const dynamic = 'force-dynamic';

const TONE = { red: 'bg-rose-500', amber: 'bg-amber-500', blue: 'bg-sky-500', green: 'bg-emerald-500' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const perms = await getPerms(user.role);
  const lang = getLang();
  const theme = getTheme();
  const labels = Object.fromEntries(Object.keys(EN).map((k) => [k, t(lang, k)]));
  const allowed = MODULE_KEYS.filter((m) => perms[m].view);
  const notes = await getNotifications();
  const business = await getSetting('business_name', 'Seven Motors');

  return (
    <div className="flex min-h-screen">
      <Sidebar allowed={allowed} labels={labels} business={business} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-end gap-2 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur md:px-6">
          <details className="relative">
            <summary className="relative flex cursor-pointer list-none items-center rounded-xl border border-line bg-panel p-2 hover:border-gold/60" title={labels.notifications}>
              <Bell size={18} />
              {notes.length > 0 && <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{notes.length}</span>}
            </summary>
            <div className="absolute end-0 mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-2xl border border-line bg-panel p-2 shadow-2xl">
              <p className="px-2 py-1 text-xs font-bold uppercase text-muted">{labels.notifications}</p>
              {notes.length === 0 && <p className="p-4 text-center text-sm text-muted">All clear — nothing needs attention.</p>}
              {notes.map((n) => (
                <Link key={n.key} href={n.href} className="flex gap-3 rounded-xl p-2 hover:bg-panel2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE[n.tone]}`} />
                  <span><span className="block text-sm font-semibold">{n.title}</span><span className="block text-xs text-muted">{n.detail}</span></span>
                </Link>
              ))}
            </div>
          </details>
          <form action={toggleLang}><button className="flex items-center gap-1 rounded-xl border border-line bg-panel px-3 py-2 text-sm hover:border-gold/60" title="English / اردو"><Languages size={16} />{lang === 'ur' ? 'English' : 'اردو'}</button></form>
          <form action={toggleTheme}><button className="rounded-xl border border-line bg-panel p-2 hover:border-gold/60" title="Theme">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button></form>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-panel py-1 pe-1 ps-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-xs font-bold uppercase text-navy-dark">{user.name.charAt(0)}</span>
            <span className="hidden text-start leading-tight sm:block"><span className="block text-xs font-semibold">{user.name}</span><span className="block text-[10px] text-muted">{user.email} · {user.role}</span></span>
            <form action={logout}><button className="rounded-lg p-1.5 text-muted hover:bg-panel2 hover:text-rose-400" title={labels.logout}><LogOut size={16} /></button></form>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        <footer className="no-print px-8 pb-6 text-center text-xs text-muted">© {new Date().getFullYear()} {business} — Car Rental Management System</footer>
      </div>
      <VoiceButton lang={lang} />
      <UploadCompressor />
    </div>
  );
}
