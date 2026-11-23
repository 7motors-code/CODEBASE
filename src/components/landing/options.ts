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

/** Pakistan Standard Time is UTC+5 all year (no daylight saving). */
const PKT_OFFSET_MS = 5 * 3_600_000;

/**
 * datetime-local value `hours` from now, on the hour, in Pakistan time.
 * The server reads these strings as Pakistan time (parsePk), so building
 * them in the visitor's own timezone would shift visitors abroad by hours.
 */
export function localInput(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3_600_000 + PKT_OFFSET_MS);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

/** Group-booking services offered in the concierge form. */
export const CONCIERGE_SERVICES = [
  'Wedding convoy',
  'Corporate monthly lease',
  'Airport group transfer',
  'Delegation or guests',
  'Northern areas tour',
] as const;

export function imageSrc(id: string): string {
  return id.startsWith('/') ? id : `/api/files/${id}`;
}
