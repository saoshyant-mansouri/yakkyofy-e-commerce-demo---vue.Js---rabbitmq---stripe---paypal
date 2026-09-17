import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Product } from '../models/index.js';

// Non-destructive counterpart to seed.js for a live database: seed.js deletes and re-inserts every
// product (new _ids, breaking existing carts and orders), whereas this only sets `images` on
// products whose photo exists in apps/web/public/products. Idempotent; dry run unless --apply.
//
// Connects with mongoose directly rather than connectDb(), which logs the full URI (password
// included).

const apply = process.argv.includes('--apply');
const photosDir = path.resolve(import.meta.dirname, '../../../web/public/products');

async function run() {
  await mongoose.connect(env.mongoUri);
  const products = await Product.find({}, { slug: 1, images: 1 }).lean();
  const ops = [];
  const missing = [];

  for (const p of products) {
    const key = p.slug.replace(/-\d+$/, '');
    if (!fs.existsSync(path.join(photosDir, `${key}-800.webp`))) {
      missing.push(p.slug);
      continue;
    }
    const images = [`/products/${key}-800.webp`];
    if (JSON.stringify(p.images) !== JSON.stringify(images)) {
      ops.push({ updateOne: { filter: { _id: p._id }, update: { $set: { images } } } });
    }
  }

  console.log(`${products.length} products, ${ops.length} to update, ${missing.length} without a photo`);
  if (missing.length) console.log('No photo:', missing.join(', '));
  if (apply && ops.length) {
    const res = await Product.bulkWrite(ops);
    console.log(`Updated ${res.modifiedCount}`);
  } else if (!apply) {
    console.log('Dry run — pass --apply to write.');
  }
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Backfill failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
