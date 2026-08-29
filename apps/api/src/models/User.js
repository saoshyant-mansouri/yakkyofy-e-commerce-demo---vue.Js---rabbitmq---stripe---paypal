import mongoose from 'mongoose';

const { Schema } = mongoose;

// NOTE: passwordHash uses `select: false` so it is never returned by default
// on any find/populate — the API must opt in with `.select('+passwordHash')`
// only inside the auth service. This is the fix for the over-fetching issue
// found in the real Yakkyofy app (a `password` field leaking via an unrelated
// populate path).
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    defaultCurrency: { type: String, default: 'EUR', uppercase: true },
    mangopay: {
      userId: { type: String, select: false },
      walletId: { type: String, select: false },
    },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.mangopay;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
