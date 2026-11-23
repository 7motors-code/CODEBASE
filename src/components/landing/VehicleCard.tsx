'use client';

import Image from 'next/image';
import { Car } from 'lucide-react';
import { pkr } from '@/lib/format';
import type { VehicleCardData } from './FleetExplorer';
import { imageSrc } from './options';

interface VehicleCardProps {
  car: VehicleCardData;
  onSelect: (car: VehicleCardData) => void;
}

const km = new Intl.NumberFormat('en-PK');

export function VehicleCard({ car, onSelect }: VehicleCardProps) {
  const photo = car.cardPhotoId || car.photoId;

  return (
    <article className="clean-card group flex w-full flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#101216]">
        {photo ? (
          <Image
            src={imageSrc(photo)}
            alt={`${car.model}${car.color ? `, ${car.color}` : ''}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-panel2 text-muted">
            <Car size={40} strokeWidth={1.25} aria-hidden />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-medium leading-snug text-ink">{car.model}</h3>
          <span className="plate shrink-0"><span>{car.regNo}</span></span>
        </div>
        <p className="mt-1 text-[13px] text-muted">
          {[car.category, car.color, `${km.format(car.meterReading)} km`].filter(Boolean).join(' · ')}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="font-mono text-lg font-medium tabular-nums text-ink">
              {pkr(car.rateDay)}
              <span className="ms-1 font-sans text-[13px] font-normal text-muted">/ day</span>
            </p>
            <p className="font-mono text-[13px] tabular-nums text-ink2">
              {pkr(car.rate12h)}
              <span className="ms-1 font-sans text-muted">/ 12h</span>
            </p>
          </div>
          <button type="button" onClick={() => onSelect(car)} aria-label={`Request ${car.model}`} className="btn-ghost group-hover:border-navy/30">
            Request
          </button>
        </div>
      </div>
    </article>
  );
}
