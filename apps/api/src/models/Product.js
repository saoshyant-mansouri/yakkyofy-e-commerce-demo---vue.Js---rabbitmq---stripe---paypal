import mongoose from 'mongoose';

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
    // Key into the frontend's ProductImageTile icon set — used instead of
    // stock photos so the product's visual always matches what it actually
    // is, rather than a randomly-assigned unrelated image.
    icon: { type: String, required: true },
    category: { type: String, required: true, index: true },
    // Base price stored as integer minor units (cents) in EUR, converted
    // server-side to the requested display currency at read time.
    basePriceMinor: { type: Number, required: true, min: 0 },
    baseCurrency: { type: String, default: 'EUR' },
    supplier: { type: String, default: 'Demo Supplier Co.' },
    stock: { type: Number, default: 100, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
