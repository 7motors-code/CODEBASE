import Image from 'next/image';
import { MessageCircle, Phone } from 'lucide-react';
import { CAR_CLASSES } from './car-classes';

interface FleetEmptyProps {
  /** When set, only this class is missing; otherwise the whole fleet is empty. */
  category: string | null;
  telHref: string | null;
  phone: string;
  whatsappHref: string | null;
  onShowAll?: () => void;
}

/** Shown when nothing is listed yet, or nothing in the chosen class. */
export function FleetEmpty({ category, telHref, phone, whatsappHref, onShowAll }: FleetEmptyProps) {
  const classes = category ? CAR_CLASSES.filter((c) => c.category === category) : CAR_CLASSES;
  const title = category ? `No ${category} listed right now` : 'The online list is being updated';
  const body = category
    ? 'Call or message the office and we will tell you what is free for your dates.'
    : 'Cars are still available. Call or message the office with your dates and the class you need.';

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-panel">
      <div className={`grid gap-px bg-line ${classes.length > 1 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
        {(classes.length ? classes : CAR_CLASSES).map((c) => (
          <figure key={c.category} className="relative bg-[#101216]">
            <div className={`relative ${classes.length > 1 ? 'aspect-[4/3]' : 'aspect-[21/9]'}`}>
              <Image src={c.photos[0].src} alt={c.photos[0].alt} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10">
              <span className="block text-[15px] font-medium text-white">{c.label}</span>
              <span className="block text-[13px] text-white/75">{c.seats}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[17px] font-medium text-ink">{title}</p>
          <p className="mt-1 max-w-xl text-sm text-ink2">{body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onShowAll && <button type="button" onClick={onShowAll} className="btn-ghost">Show all classes</button>}
          {whatsappHref && (
            <a href={`${whatsappHref}?text=${encodeURIComponent(`Hello Seven Motors, I need ${category ? `a ${category}` : 'a car'}. Which cars are free?`)}`}
              target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <MessageCircle size={16} strokeWidth={1.5} className="text-muted" />WhatsApp
            </a>
          )}
          {telHref ? (
            <a href={telHref} className="btn-primary"><Phone size={16} strokeWidth={1.5} /><span className="font-mono tabular-nums">{phone}</span></a>
          ) : (
            <a href="#concierge" className="btn-primary">Request a quote</a>
          )}
        </div>
      </div>
    </div>
  );
}
