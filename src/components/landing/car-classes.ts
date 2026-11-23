/**
 * Car classes shown in the hero showroom and the empty-fleet state.
 * Photos illustrate the class only; rates and counts always come from
 * the live fleet (see ClassStats), never from this file.
 */
export interface CarClass {
  /** Matches vehicles.category (CAR_CATEGORY lookup). */
  category: string;
  label: string;
  seats: string;
  suits: string;
  photos: readonly { src: string; alt: string }[];
}

export const CAR_CLASSES: readonly CarClass[] = [
  {
    category: 'SUV', label: 'SUV', seats: '7 seats',
    suits: 'Family trips, the motorway and the northern areas',
    photos: [{ src: '/cars/fortuner.jpg', alt: 'White SUV in a studio' }],
  },
  {
    category: 'Sedan', label: 'Sedan', seats: '5 seats',
    suits: 'City driving, office runs and airport pickups',
    photos: [
      { src: '/cars/corolla-grande.jpg', alt: 'White sedan in a studio' },
      { src: '/cars/civic-rs.jpg', alt: 'Black sports sedan in a studio' },
      { src: '/cars/yaris.jpg', alt: 'Silver compact sedan in a studio' },
    ],
  },
  {
    category: 'Luxury', label: 'Luxury', seats: '5–7 seats',
    suits: 'Weddings, guests and events',
    photos: [
      { src: '/cars/land-cruiser.jpg', alt: 'Black luxury SUV in a studio' },
      { src: '/cars/byd-seal.jpg', alt: 'Green electric sedan in a studio' },
    ],
  },
  {
    category: 'Pickup', label: 'Pickup', seats: '5 seats',
    suits: 'Cargo, site visits and rough roads',
    photos: [{ src: '/cars/hilux-revo.jpg', alt: 'Black double-cab pickup in a studio' }],
  },
];

/** Live numbers for one class, computed on the server from active vehicles. */
export interface ClassStat {
  count: number;
  fromDay: number | null;
}
export type ClassStats = Record<string, ClassStat>;
