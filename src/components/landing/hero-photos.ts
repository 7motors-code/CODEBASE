/**
 * Background photos for the landing hero. All are real Pakistani roads,
 * taken from Unsplash under the Unsplash License (free for commercial use).
 * `focus` is the CSS object-position that keeps the car in frame when the
 * photo is cropped to the viewport.
 */
export interface HeroPhoto {
  src: string;
  place: string;
  credit: string;
  focus: string;
}

export const HERO_PHOTOS: readonly HeroPhoto[] = [
  { src: '/hero/prado-dunga-gali.jpg', place: 'Dunga Gali', credit: 'Kashif Afridi', focus: '70% 60%' },
  { src: '/hero/civic-islamabad.jpg', place: 'Islamabad', credit: 'Kashif Afridi', focus: '50% 70%' },
  { src: '/hero/land-cruiser-karachi.jpg', place: 'Karachi', credit: 'Kashif Afridi', focus: '50% 55%' },
  { src: '/hero/mg-islamabad.jpg', place: 'Islamabad', credit: 'Kashif Afridi', focus: '50% 72%' },
  { src: '/hero/sheikhupura-night.jpg', place: 'Sheikhupura', credit: 'Salman Ahmad', focus: '50% 70%' },
];
