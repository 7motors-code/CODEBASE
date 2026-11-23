export const PICKUP_HUBS = [
  { value: 'Islamabad', label: 'Islamabad / Rawalpindi' },
  { value: 'Islamabad Airport', label: 'Islamabad Airport (ISB)' },
  { value: 'Lahore', label: 'Lahore' },
  { value: 'Karachi', label: 'Karachi' },
] as const;

export type DurationType = 'DAY' | '12H';

/** Fired by the hero search so the fleet's booking form starts with the same trip. */
export const SEARCH_EVENT = 'sm:trip';
/** Fired by the showroom with a vehicle category to filter the fleet. */
export const CLASS_EVENT = 'sm:class';
export interface TripDetail { city: string; start: string; end: string; durationType: DurationType }

/** datetime-local value `hours` from now, in the visitor's local time. */
export function localInput(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3_600_000);
  d.setMinutes(0, 0, 0);
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function imageSrc(id: string): string {
  return id.startsWith('/') ? id : `/api/files/${id}`;
}
