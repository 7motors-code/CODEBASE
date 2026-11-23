'use client';
import { Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Voice navigation & search: say a module name ("bookings", "open maintenance", "بکنگ")
// or anything else to search bookings, customers and cars.
const ROUTES: [RegExp, string][] = [
  [/dashboard|ڈیش/i, '/admin'], [/car|vehicle|گاڑی/i, '/admin/cars'], [/booking|بکنگ/i, '/admin/bookings'],
  [/receiv|return|واپسی/i, '/admin/receiving'], [/mainten|مینٹی/i, '/admin/maintenance'], [/damage|ڈیمیج/i, '/admin/damage'],
  [/driver|ڈرائیور/i, '/admin/drivers'], [/customer|کسٹمر/i, '/admin/customers'], [/user|یوزر/i, '/admin/users'],
  [/investor|انویسٹر/i, '/admin/investors'], [/payment|ادائیگ/i, '/admin/payments'], [/expense|خرچ|اخراجات/i, '/admin/expenses'],
  [/report|رپورٹ/i, '/admin/reports'], [/location|مقام/i, '/admin/locations'],
];

export default function VoiceButton({ lang }: { lang: string }) {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  function start() {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) { setHeard('Voice input needs Google Chrome'); setTimeout(() => setHeard(''), 3000); return; }
    const r = new SR();
    r.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
    r.interimResults = false;
    r.onresult = (e) => {
      const text = e.results[0][0].transcript.trim();
      setHeard(text);
      const words = text.replace(/^(open|go to|show)\s+/i, '');
      const hit = ROUTES.find(([re]) => re.test(words) && words.split(' ').length <= 3);
      router.push(hit ? hit[1] : `/admin/search?q=${encodeURIComponent(words)}`);
      setTimeout(() => setHeard(''), 3000);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    setListening(true);
    r.start();
  }
  return (
    <div className="no-print fixed bottom-5 end-5 z-40 flex items-center gap-2">
      {heard && <span className="rounded-lg border border-line bg-panel px-3 py-1.5 text-[13px] text-ink shadow-float">“{heard}”</span>}
      <button onClick={start} title="Voice: say a module name or what to search" aria-label={listening ? 'Listening' : 'Voice command'} aria-pressed={listening}
        className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-float transition-colors duration-150 ${listening ? 'border-bad bg-bad text-white' : 'border-line bg-panel text-ink2 hover:text-ink'}`}>
        <Mic size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}
type SpeechRec = { lang: string; interimResults: boolean; start: () => void; onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void; onend: () => void; onerror: () => void };
