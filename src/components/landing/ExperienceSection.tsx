import { ShieldCheck, Clock, Award, Sparkles, Compass, CheckCircle } from 'lucide-react';

export function ExperienceSection() {
  const features = [
    {
      icon: <Sparkles className="text-gold" size={24} />,
      title: 'Punctual & Spotless Fleet',
      desc: 'Every vehicle undergoes multi-point safety checks, exterior detailing, and interior ozone sanitization before delivery.',
    },
    {
      icon: <Clock className="text-emerald-400" size={24} />,
      title: 'Genuine 12-Hour & 24-Hour Rates',
      desc: 'Why pay for a full 24 hours when you only need an executive car for the workday? Flexible shifts tailored for your schedule.',
    },
    {
      icon: <ShieldCheck className="text-sky-400" size={24} />,
      title: '1-Hour Grace Return Policy',
      desc: 'Traffic delays in Islamabad or Lahore should never penalize you. Enjoy an automatic 1-hour grace window on every return.',
    },
    {
      icon: <Award className="text-amber-400" size={24} />,
      title: 'Vetted Executive Chauffeurs',
      desc: 'Polite, uniformed, and background-checked drivers trained in VIP protocol, family discretion, and intercity navigation.',
    },
    {
      icon: <Compass className="text-violet-400" size={24} />,
      title: 'Seamless Intercity Coverage',
      desc: 'Pick up in Islamabad, drive to Murree, Peshawar, or Lahore with zero paperwork friction and full 24/7 tracking support.',
    },
    {
      icon: <CheckCircle className="text-teal-400" size={24} />,
      title: 'Transparent Paper & Digital Contracts',
      desc: 'Crystal clear terms, automated payment receipts, and immediate WhatsApp digital agreement copies for peace of mind.',
    },
  ];

  return (
    <section id="experience" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">The Standard of Luxury</span>
          <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            Engineered For The Discerning Traveler
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70">
            From diplomatic delegations in the Capital to family road trips across Northern Pakistan, we provide comfort, punctuality, and total reliability.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => (
            <div key={idx} className="liquid-card rounded-2xl p-6 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                {feat.icon}
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{feat.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
