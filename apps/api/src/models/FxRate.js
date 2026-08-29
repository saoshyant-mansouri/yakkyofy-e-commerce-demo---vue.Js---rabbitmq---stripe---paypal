import mongoose from 'mongoose';

const { Schema } = mongoose;

const fxRateSchema = new Schema(
  {
    base: { type: String, required: true, unique: true, default: 'EUR' },
    rates: { type: Schema.Types.Mixed, required: true },
    fetchedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export const FxRate = mongoose.model('FxRate', fxRateSchema);
