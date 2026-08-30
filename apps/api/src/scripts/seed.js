import { connectDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { Product, User } from '../models/index.js';
import { hashPassword } from '../services/authService.js';

// Hand-curated catalogue — each product's `icon` (rendered by the frontend's
// ProductImageTile) is chosen to actually match the product, unlike the
// earlier random-photo generator where the image and the title were
// unrelated. Prices are integer EUR cents (basePriceMinor).
const PRODUCTS = [
  // --- Electronics ---
  {
    title: 'Wireless Bluetooth Earbuds Pro',
    category: 'Electronics',
    icon: 'headphones',
    price: 7999,
    stock: 84,
    description:
      'Active noise cancellation, 30-hour battery life with the charging case, and IPX4 sweat resistance for workouts.',
  },
  {
    title: '65W USB-C GaN Fast Charger',
    category: 'Electronics',
    icon: 'bolt',
    price: 3499,
    stock: 120,
    description:
      'Compact dual-port charger that fuels a laptop and a phone at once, without the desk-hogging brick.',
  },
  {
    title: '4K Ultra HD Webcam with Auto-Focus',
    category: 'Electronics',
    icon: 'camera',
    price: 8999,
    stock: 46,
    description:
      'Studio-quality video for calls and streams, with a built-in privacy shutter and dual noise-cancelling mics.',
  },
  {
    title: 'Hot-Swappable Mechanical Keyboard',
    category: 'Electronics',
    icon: 'keyboard',
    price: 11999,
    stock: 37,
    description:
      '75% layout with hot-swappable switches, per-key RGB, and an aluminum frame that shrugs off desk abuse.',
  },
  {
    title: 'Portable Bluetooth Speaker, Waterproof',
    category: 'Electronics',
    icon: 'speaker',
    price: 5999,
    stock: 68,
    description: '360° sound in an IP67-rated shell that survives the pool, the beach, and everything between.',
  },
  {
    title: 'Wireless Charging Stand, 15W',
    category: 'Electronics',
    icon: 'battery',
    price: 2999,
    stock: 95,
    description: 'Drop your phone on at an angle you can actually read notifications from, case and all.',
  },
  {
    title: 'Noise-Cancelling Over-Ear Headphones',
    category: 'Electronics',
    icon: 'headphones',
    price: 14999,
    stock: 29,
    description: '40mm drivers, 35-hour battery, and adaptive ANC that tunes itself to your surroundings.',
  },
  {
    title: 'Smart LED Desk Lamp',
    category: 'Electronics',
    icon: 'lamp',
    price: 4499,
    stock: 73,
    description:
      'Adjustable colour temperature, a USB-C fast-charging port, and touch dimming built into the base.',
  },

  // --- Home & Kitchen ---
  {
    title: '4-Slice Stainless Steel Toaster',
    category: 'Home & Kitchen',
    icon: 'toaster',
    price: 4999,
    stock: 52,
    description: 'Wide slots fit bagels and thick-cut bread, with six shade settings and a removable crumb tray.',
  },
  {
    title: 'Ceramic Non-Stick Fry Pan, 28cm',
    category: 'Home & Kitchen',
    icon: 'pan',
    price: 3999,
    stock: 61,
    description: 'PFOA-free ceramic coating that releases eggs and pancakes without a fight, oven-safe to 180°C.',
  },
  {
    title: 'Programmable Drip Coffee Maker',
    category: 'Home & Kitchen',
    icon: 'cup',
    price: 5499,
    stock: 44,
    description: 'Set it the night before and wake up to a full 12-cup carafe, with a keep-warm plate built in.',
  },
  {
    title: 'Digital Kitchen Scale, 5kg',
    category: 'Home & Kitchen',
    icon: 'scale',
    price: 1999,
    stock: 88,
    description: 'Tare-to-zero precision in 1g increments, with a pull-out display that reads clearly under a bowl.',
  },
  {
    title: '6-Piece Stainless Steel Knife Set',
    category: 'Home & Kitchen',
    icon: 'knife',
    price: 6999,
    stock: 33,
    description:
      'Full-tang forged blades with a magnetic wall strip, sharp enough out of the box for restaurant prep.',
  },
  {
    title: 'Electric Kettle, 1.7L Rapid Boil',
    category: 'Home & Kitchen',
    icon: 'kettle',
    price: 3299,
    stock: 76,
    description: 'Boils a full kettle in under 3 minutes, with a concealed heating element that is easy to descale.',
  },
  {
    title: '8-in-1 Multi-Cooker & Pressure Cooker',
    category: 'Home & Kitchen',
    icon: 'pot',
    price: 8999,
    stock: 27,
    description: 'Pressure cook, slow cook, sauté, and steam in one pot — one appliance instead of four.',
  },
  {
    title: 'Bamboo Cutting Board Set (3-Piece)',
    category: 'Home & Kitchen',
    icon: 'mat',
    price: 2799,
    stock: 59,
    description: 'Naturally antibacterial bamboo in three sizes, gentle enough on knife edges to make them last.',
  },

  // --- Fitness ---
  {
    title: 'Adjustable Dumbbell Set, 2×20kg',
    category: 'Fitness',
    icon: 'dumbbell',
    price: 18999,
    stock: 21,
    description:
      'Quick-select weight plates swap from 5kg to 20kg per hand in seconds — replaces a full rack of dumbbells.',
  },
  {
    title: 'Premium Yoga Mat with Carry Strap',
    category: 'Fitness',
    icon: 'mat',
    price: 3499,
    stock: 67,
    description:
      '6mm of cushioning with a non-slip textured surface, plus a strap so it is not a rolled-up nuisance to carry.',
  },
  {
    title: 'Resistance Bands Set (5 Levels)',
    category: 'Fitness',
    icon: 'ring',
    price: 2499,
    stock: 90,
    description:
      'Five resistance levels from light to heavy, with a door anchor and handles for a full home gym in a bag.',
  },
  {
    title: 'High-Density Foam Roller',
    category: 'Fitness',
    icon: 'roller',
    price: 2299,
    stock: 54,
    description: 'Firm enough to actually work out knots after leg day, textured to target specific muscle groups.',
  },
  {
    title: 'Adjustable Jump Rope, Ball Bearing',
    category: 'Fitness',
    icon: 'ring',
    price: 1499,
    stock: 102,
    description: 'Smooth, tangle-free spins from sealed ball bearings, with a cable you can trim to your height.',
  },
  {
    title: 'Insulated Sports Water Bottle, 1L',
    category: 'Fitness',
    icon: 'bottle',
    price: 2499,
    stock: 79,
    description: 'Keeps water cold through a hard workout and the drive home, with a leak-proof flip lid.',
  },
  {
    title: 'Neoprene Dumbbell Pair, 2×5kg',
    category: 'Fitness',
    icon: 'dumbbell',
    price: 2299,
    stock: 71,
    description: 'Colour-coded, grippy neoprene coating that will not roll off a yoga mat mid-set.',
  },
  {
    title: 'Adjustable Ab Wheel Roller',
    category: 'Fitness',
    icon: 'roller',
    price: 1899,
    stock: 63,
    description: 'Dual wheels for stability and a thick foam grip that keeps core work from wrecking your wrists.',
  },

  // --- Beauty ---
  {
    title: 'Vitamin C Brightening Face Serum',
    category: 'Beauty',
    icon: 'droplet',
    price: 2899,
    stock: 58,
    description: '10% vitamin C plus hyaluronic acid in a dark glass dropper bottle that keeps the formula stable.',
  },
  {
    title: 'Sonic Facial Cleansing Brush',
    category: 'Beauty',
    icon: 'brush',
    price: 3999,
    stock: 41,
    description: 'Silicone bristles pulse at 8,000 strokes a minute to lift makeup and buildup without scrubbing raw.',
  },
  {
    title: 'Ceramic Tourmaline Hair Straightener',
    category: 'Beauty',
    icon: 'flatiron',
    price: 4499,
    stock: 36,
    description: 'Floating plates glide through knots at an even 230°C, ready to use in under 30 seconds.',
  },
  {
    title: 'Rechargeable Foil Electric Shaver',
    category: 'Beauty',
    icon: 'razor',
    price: 4999,
    stock: 30,
    description: 'Hypoallergenic foil heads and a 60-minute cordless runtime, with a travel lock for the bag.',
  },
  {
    title: 'Ultrasonic Aromatherapy Diffuser',
    category: 'Beauty',
    icon: 'droplet',
    price: 3299,
    stock: 65,
    description: 'Runs silent for up to 10 hours on a fill, cycling through a seven-colour ambient light if you want it.',
  },
  {
    title: 'Professional Makeup Brush Set (12-Piece)',
    category: 'Beauty',
    icon: 'brush',
    price: 2699,
    stock: 74,
    description: 'Synthetic bristles that hold pigment evenly, from a full face brush down to a precise liner.',
  },
  {
    title: 'Rose Quartz Facial Roller',
    category: 'Beauty',
    icon: 'roller',
    price: 1699,
    stock: 82,
    description: 'A cooling, weighted roll for puffiness and product absorption — five minutes, morning or night.',
  },
  {
    title: 'Travel Makeup Organizer Case',
    category: 'Beauty',
    icon: 'box',
    price: 2299,
    stock: 48,
    description: 'Fits a full routine into carry-on-sized compartments, with a mirror built into the lid.',
  },

  // --- Outdoor ---
  {
    title: '2-Person Backpacking Tent',
    category: 'Outdoor',
    icon: 'tent',
    price: 7999,
    stock: 25,
    description: 'Sets up solo in under five minutes and packs down to about the size of a loaf of bread.',
  },
  {
    title: 'Folding Camping Chair with Cup Holder',
    category: 'Outdoor',
    icon: 'chair',
    price: 3499,
    stock: 56,
    description: 'Supports 150kg, packs into its own bag, and sets up without wrestling with a manual.',
  },
  {
    title: 'Rechargeable LED Headlamp',
    category: 'Outdoor',
    icon: 'lamp',
    price: 2499,
    stock: 69,
    description: '350 lumens with a red night-vision mode that will not wreck your eyes reading a map in the dark.',
  },
  {
    title: 'Insulated Stainless Steel Water Bottle, 750ml',
    category: 'Outdoor',
    icon: 'bottle',
    price: 2799,
    stock: 91,
    description: 'Double-wall vacuum insulation keeps cold water cold for 24 hours on the trail.',
  },
  {
    title: 'Portable Camping Hammock with Straps',
    category: 'Outdoor',
    icon: 'hammock',
    price: 2999,
    stock: 47,
    description: 'Rated to 300kg, sets up between two trees in minutes with the included tree-friendly straps.',
  },
  {
    title: 'Multi-Tool Pocket Knife (15-in-1)',
    category: 'Outdoor',
    icon: 'knife',
    price: 1999,
    stock: 88,
    description: 'Locking blade, pliers, screwdrivers, and a bottle opener, all folding into a pocket-sized case.',
  },
  {
    title: 'Waterproof Dry Bag, 20L',
    category: 'Outdoor',
    icon: 'box',
    price: 1899,
    stock: 60,
    description: 'Keeps gear bone-dry on the water — rolls down and clips shut in three seconds.',
  },
  {
    title: 'Compact Camping Stove with Piezo Ignition',
    category: 'Outdoor',
    icon: 'pot',
    price: 3299,
    stock: 39,
    description: 'Boils water in under 4 minutes, folds flat to fit in a jacket pocket alongside the fuel canister.',
  },

  // --- Pet Supplies ---
  {
    title: 'Adjustable Nylon Dog Leash, 1.8m',
    category: 'Pet Supplies',
    icon: 'leash',
    price: 1699,
    stock: 97,
    description: 'A padded handle and a reinforced clip that holds up to enthusiastic pulling on daily walks.',
  },
  {
    title: 'Automatic Pet Food Dispenser',
    category: 'Pet Supplies',
    icon: 'bowl',
    price: 4499,
    stock: 34,
    description:
      'Schedules up to four meals a day with a voice-recording slot, so feeding time sounds like you even when you are not home.',
  },
  {
    title: 'Multi-Level Cat Scratching Post Tower',
    category: 'Pet Supplies',
    icon: 'tower',
    price: 5999,
    stock: 22,
    description: 'Three sisal-wrapped posts and two perches, sturdy enough that a determined cat cannot tip it over.',
  },
  {
    title: 'Orthopedic Memory Foam Pet Bed',
    category: 'Pet Supplies',
    icon: 'bed',
    price: 3999,
    stock: 43,
    description: 'Supports aging joints better than a folded blanket ever could, with a removable washable cover.',
  },
  {
    title: 'Interactive Treat-Dispensing Puzzle Toy',
    category: 'Pet Supplies',
    icon: 'puzzle',
    price: 1699,
    stock: 78,
    description: 'Slows down fast eaters and burns mental energy on rainy days when a walk is not happening.',
  },
  {
    title: 'Slicker Grooming Brush for Short Hair',
    category: 'Pet Supplies',
    icon: 'brush',
    price: 1499,
    stock: 85,
    description: 'Fine bent wires lift loose undercoat without scratching skin, self-cleaning with a single button.',
  },
  {
    title: 'Stainless Steel Double Pet Bowl Stand',
    category: 'Pet Supplies',
    icon: 'bowl',
    price: 2199,
    stock: 66,
    description: 'Raised feeding angle that is easier on the neck, with removable bowls that go straight in the dishwasher.',
  },
  {
    title: 'Retractable Dog Leash, 5m',
    category: 'Pet Supplies',
    icon: 'leash',
    price: 2499,
    stock: 72,
    description: 'One-button lock and brake, with a reflective cord that stays visible on evening walks.',
  },
];

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildProducts() {
  return PRODUCTS.map((p, i) => ({
    title: p.title,
    slug: `${slugify(p.title)}-${i + 1}`,
    description: p.description,
    icon: p.icon,
    images: [],
    category: p.category,
    basePriceMinor: p.price,
    baseCurrency: 'EUR',
    supplier: 'Demo Supplier Co.',
    stock: p.stock,
  }));
}

async function seed() {
  await connectDb();

  await Product.deleteMany({});
  await Product.insertMany(buildProducts());
  logger.info({ count: PRODUCTS.length }, 'Seeded products');

  const demoEmail = 'demo@yakkyofy-clone.test';
  const existing = await User.findOne({ email: demoEmail });
  if (!existing) {
    const passwordHash = await hashPassword('DemoPass123!');
    await User.create({ email: demoEmail, passwordHash, name: 'Demo User' });
    logger.info({ email: demoEmail, password: 'DemoPass123!' }, 'Created demo user');
  } else {
    logger.info('Demo user already exists');
  }

  logger.info('Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
