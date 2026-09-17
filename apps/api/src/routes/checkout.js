import { Router } from 'express';
import { z } from 'zod';
import { Cart, Order } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { getRates, convertMinor, SUPPORTED_CURRENCIES } from '../services/currencyService.js';
import { publishOrderCreated } from '../services/amqp.js';
import * as stripeService from '../services/payments/stripeService.js';
import * as paypalService from '../services/payments/paypalService.js';
import * as mangopayService from '../services/payments/mangopayService.js';

export const checkoutRouter = Router();
checkoutRouter.use(requireAuth);

async function buildOrderFromCart(userId, currency) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    const err = new Error('Cart is empty');
    err.status = 400;
    err.publicMessage = 'Cart is empty';
    throw err;
  }
  const rates = await getRates();
  const items = [];
  let amountMinor = 0;
  for (const item of cart.items) {
    const product = item.product;
    const unitPriceMinor = convertMinor(product.basePriceMinor, currency, rates);
    amountMinor += unitPriceMinor * item.qty;
    items.push({ product: product._id, title: product.title, qty: item.qty, unitPriceMinor });
  }
  return { cart, items, amountMinor };
}

// Pending -> processing exactly once. The check and the write are one atomic update, so a double
// click, a retried request, or the Stripe webhook racing the client confirm can't process (and
// charge stock for) the same order twice. Returns null if the order was already moved on.
async function markProcessing(filter, message, extra = {}) {
  return Order.findOneAndUpdate(
    { ...filter, status: 'pending' },
    { $set: { status: 'processing', ...extra }, $push: { events: { status: 'processing', message } } },
    { new: true }
  );
}

function alreadyHandled(res) {
  return res.status(409).json({ error: 'Order is not awaiting payment' });
}

// Only providers with credentials configured are offered; Mangopay isn't set up in production.
function providerConfigured(provider) {
  if (provider === 'stripe') return Boolean(env.stripe.secretKey);
  if (provider === 'paypal') return Boolean(env.paypal.clientId && env.paypal.clientSecret);
  return Boolean(env.mangopay.clientId && env.mangopay.apiKey);
}

// The Mangopay ids live on the user with `select: false`; load them explicitly so an existing
// Mangopay user/wallet is reused instead of a new one being created on every checkout.
function loadUserWithMangopay(userId) {
  return User.findById(userId).select('+mangopay.userId +mangopay.walletId');
}

const startSchema = z.object({
  provider: z.enum(['stripe', 'paypal', 'mangopay']),
  currency: z.enum(SUPPORTED_CURRENCIES).default('EUR'),
});

checkoutRouter.post('/start', async (req, res, next) => {
  try {
    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
    const { provider, currency } = parsed.data;
    if (!providerConfigured(provider)) {
      return res.status(503).json({ error: 'This payment provider is not available' });
    }

    const { items, amountMinor } = await buildOrderFromCart(req.user._id, currency);

    const order = await Order.create({
      user: req.user._id,
      items,
      currency,
      amountMinor,
      provider,
      status: 'pending',
      events: [{ status: 'pending', message: 'Order created' }],
    });

    if (provider === 'stripe') {
      const { providerRef, clientSecret } = await stripeService.createPaymentIntent({
        amountMinor,
        currency,
        orderId: order._id.toString(),
      });
      order.providerRef = providerRef;
      await order.save();
      return res.json({ orderId: order._id, provider, clientSecret });
    }

    if (provider === 'paypal') {
      const { providerRef } = await paypalService.createOrder({
        amountMinor,
        currency,
        orderId: order._id.toString(),
      });
      order.providerRef = providerRef;
      await order.save();
      return res.json({ orderId: order._id, provider, paypalOrderId: providerRef });
    }

    if (provider === 'mangopay') {
      const mpUser = await loadUserWithMangopay(req.user._id);
      const mpUserId = await mangopayService.ensureMangopayUser(mpUser);
      const walletId = await mangopayService.ensureWallet(mpUser, mpUserId, currency);
      const registration = await mangopayService.createCardRegistration(mpUserId, currency);
      return res.json({
        orderId: order._id,
        provider,
        cardRegistration: {
          id: registration.Id,
          accessKey: registration.AccessKey,
          preregistrationData: registration.PreregistrationData,
          cardRegistrationURL: registration.CardRegistrationURL,
        },
        mpUserId,
        walletId,
      });
    }
  } catch (err) {
    next(err);
  }
});

// --- Stripe: confirmed client-side; frontend calls this once the PaymentIntent succeeds. ---
checkoutRouter.post('/stripe/confirm', async (req, res, next) => {
  try {
    const { orderId } = z.object({ orderId: z.string().length(24) }).parse(req.body);
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.provider !== 'stripe' || !order.providerRef) return alreadyHandled(res);

    const intent = await stripeService.retrievePaymentIntent(order.providerRef);
    // The intent must be settled, and for exactly this order's amount and currency.
    if (
      intent.status !== 'succeeded' ||
      intent.metadata?.orderId !== order._id.toString() ||
      intent.amount !== order.amountMinor ||
      intent.currency !== order.currency.toLowerCase()
    ) {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    const updated = await markProcessing({ _id: order._id }, 'Stripe payment confirmed');
    if (!updated) {
      // The webhook got there first: the order is already being processed. Not an error.
      await clearCart(req.user._id);
      return res.json({ order: await Order.findById(order._id).lean() });
    }
    await publishOrderCreated(updated);
    await clearCart(req.user._id);
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

// --- PayPal: capture on the server once the buyer approves in the SDK button flow. ---
checkoutRouter.post('/paypal/capture', async (req, res, next) => {
  try {
    const { orderId } = z.object({ orderId: z.string().length(24) }).parse(req.body);
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.provider !== 'paypal' || order.status !== 'pending' || !order.providerRef) {
      return alreadyHandled(res);
    }

    const capture = await paypalService.captureOrder(order.providerRef);
    if (capture.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    const updated = await markProcessing({ _id: order._id }, 'PayPal payment captured');
    if (!updated) return alreadyHandled(res);
    await publishOrderCreated(updated);
    await clearCart(req.user._id);
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

// --- Mangopay: finalize card tokenization, then run the direct pay-in. ---
// mpUserId/walletId are deliberately not read from the request: they come from the signed-in
// user's own record, so a caller can't charge a card into (or on behalf of) someone else's wallet.
const mangopaySchema = z.object({
  orderId: z.string().length(24),
  registrationId: z.string().min(1).max(64),
  registrationData: z.string().min(1).max(4096),
});

checkoutRouter.post('/mangopay/pay', async (req, res, next) => {
  try {
    if (!providerConfigured('mangopay')) {
      return res.status(503).json({ error: 'This payment provider is not available' });
    }
    const parsed = mangopaySchema.parse(req.body);
    const order = await Order.findOne({ _id: parsed.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.provider !== 'mangopay' || order.status !== 'pending') return alreadyHandled(res);

    const mpUser = await loadUserWithMangopay(req.user._id);
    const mpUserId = mpUser?.mangopay?.userId;
    const walletId = mpUser?.mangopay?.walletId;
    if (!mpUserId || !walletId) return res.status(400).json({ error: 'Checkout not started' });

    const finalized = await mangopayService.finalizeCardRegistration(
      parsed.registrationId,
      parsed.registrationData
    );
    const payIn = await mangopayService.createDirectPayIn({
      mpUserId,
      walletId,
      cardId: finalized.CardId,
      amountMinor: order.amountMinor,
      currency: order.currency,
    });

    if (payIn.Status !== 'SUCCEEDED') {
      const failed = await Order.findOneAndUpdate(
        { _id: order._id, status: 'pending' },
        {
          $set: { status: 'failed', providerRef: payIn.Id },
          $push: { events: { status: 'failed', message: `Mangopay PayIn status: ${payIn.Status}` } },
        },
        { new: true }
      );
      return res.status(402).json({ error: 'Payment not completed', order: failed });
    }

    const updated = await markProcessing({ _id: order._id }, 'Mangopay PayIn succeeded', {
      providerRef: payIn.Id,
    });
    if (!updated) return alreadyHandled(res);
    await publishOrderCreated(updated);
    await clearCart(req.user._id);
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

async function clearCart(userId) {
  await Cart.findOneAndUpdate({ user: userId }, { items: [] });
}
