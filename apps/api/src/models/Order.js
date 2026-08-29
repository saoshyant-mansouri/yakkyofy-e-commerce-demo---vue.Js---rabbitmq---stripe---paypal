import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPriceMinor: { type: Number, required: true },
  },
  { _id: false }
);

const orderEventSchema = new Schema(
  {
    status: { type: String, required: true },
    message: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    currency: { type: String, required: true },
    amountMinor: { type: Number, required: true },
    provider: { type: String, enum: ['stripe', 'paypal', 'mangopay'], required: true },
    providerRef: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    events: { type: [orderEventSchema], default: [] },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
