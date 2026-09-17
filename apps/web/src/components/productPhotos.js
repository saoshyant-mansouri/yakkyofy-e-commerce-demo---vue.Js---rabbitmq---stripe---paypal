/**
 * Product photos are static files in public/products (Unsplash License, credits in CREDITS.md
 * there), served from the web app's own origin so they load without the API and without a
 * third-party hop. Two WebP widths each (400/800) feed `srcset`, so a phone never downloads the
 * large one.
 *
 * Photos are matched by slug with the seed's numeric suffix removed, so the right image shows
 * even on a database seeded before `images` was populated. Anything unmatched keeps the icon tile.
 */

const PHOTO_KEYS = new Set([
  '2-person-backpacking-tent',
  '4-slice-stainless-steel-toaster',
  '4k-ultra-hd-webcam-with-auto-focus',
  '6-piece-stainless-steel-knife-set',
  '65w-usb-c-gan-fast-charger',
  '8-in-1-multi-cooker-pressure-cooker',
  'adjustable-ab-wheel-roller',
  'adjustable-dumbbell-set-2-20kg',
  'adjustable-jump-rope-ball-bearing',
  'adjustable-nylon-dog-leash-1-8m',
  'automatic-pet-food-dispenser',
  'bamboo-cutting-board-set-3-piece',
  'ceramic-non-stick-fry-pan-28cm',
  'ceramic-tourmaline-hair-straightener',
  'compact-camping-stove-with-piezo-ignition',
  'digital-kitchen-scale-5kg',
  'electric-kettle-1-7l-rapid-boil',
  'folding-camping-chair-with-cup-holder',
  'high-density-foam-roller',
  'hot-swappable-mechanical-keyboard',
  'insulated-sports-water-bottle-1l',
  'insulated-stainless-steel-water-bottle-750ml',
  'interactive-treat-dispensing-puzzle-toy',
  'multi-level-cat-scratching-post-tower',
  'multi-tool-pocket-knife-15-in-1',
  'neoprene-dumbbell-pair-2-5kg',
  'noise-cancelling-over-ear-headphones',
  'orthopedic-memory-foam-pet-bed',
  'portable-bluetooth-speaker-waterproof',
  'portable-camping-hammock-with-straps',
  'premium-yoga-mat-with-carry-strap',
  'professional-makeup-brush-set-12-piece',
  'programmable-drip-coffee-maker',
  'rechargeable-foil-electric-shaver',
  'rechargeable-led-headlamp',
  'resistance-bands-set-5-levels',
  'retractable-dog-leash-5m',
  'rose-quartz-facial-roller',
  'slicker-grooming-brush-for-short-hair',
  'smart-led-desk-lamp',
  'sonic-facial-cleansing-brush',
  'stainless-steel-double-pet-bowl-stand',
  'travel-makeup-organizer-case',
  'ultrasonic-aromatherapy-diffuser',
  'vitamin-c-brightening-face-serum',
  'waterproof-dry-bag-20l',
  'wireless-bluetooth-earbuds-pro',
  'wireless-charging-stand-15w',
]);

export function productPhotoKey(product) {
  const fromImages = product?.images?.[0]?.match(/\/products\/([a-z0-9-]+)-\d+\.webp$/)?.[1];
  if (fromImages && PHOTO_KEYS.has(fromImages)) return fromImages;
  const key = product?.slug?.replace(/-\d+$/, '');
  return key && PHOTO_KEYS.has(key) ? key : null;
}

export function productPhotoSources(product) {
  const key = productPhotoKey(product);
  if (!key) return null;
  return {
    src: `/products/${key}-400.webp`,
    srcset: `/products/${key}-400.webp 400w, /products/${key}-800.webp 800w`,
  };
}
