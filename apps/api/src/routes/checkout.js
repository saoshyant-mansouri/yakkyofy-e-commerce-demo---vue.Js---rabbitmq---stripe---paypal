import { Router } from 'express';
import { z } from 'zod';
import { Cart, Order } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
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

const startSchema = z.object({
  provider: z.enum(['stripe', 'paypal', 'mangopay']),
  currency: z.enum(SUPPORTED_CURRENCIES).default('EUR'),
});

checkoutRouter.post('/start', async (req, res, next) => {
  try {
    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
    const { provider, currency } = parsed.data;

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
      const mpUserId = await mangopayService.ensureMangopayUser(req.user);
      const walletId = await mangopayService.ensureWallet(req.user, mpUserId, currency);
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

    const intent = await stripeService.retrievePaymentIntent(order.providerRef);
    if (intent.status !== 'succeeded') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    order.status = 'processing';
    order.events.push({ status: 'processing', message: 'Stripe payment confirmed' });
    await order.save();
    await publishOrderCreated(order);
    await clearCart(req.user._id);
    res.json({ order });
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

    const capture = await paypalService.captureOrder(order.providerRef);
    if (capture.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    order.status = 'processing';
    order.events.push({ status: 'processing', message: 'PayPal payment captured' });
    await order.save();
    await publishOrderCreated(order);
    await clearCart(req.user._id);
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// --- Mangopay: finalize card tokenization, then run the direct pay-in. ---
const mangopaySchema = z.object({
  orderId: z.string().length(24),
  registrationId: z.string(),
  registrationData: z.string(),
  mpUserId: z.string(),
  walletId: z.string(),
});

checkoutRouter.post('/mangopay/pay', async (req, res, next) => {
  try {
    const parsed = mangopaySchema.parse(req.body);
    const order = await Order.findOne({ _id: parsed.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const finalized = await mangopayService.finalizeCardRegistration(
      parsed.registrationId,
      parsed.registrationData
    );
    const payIn = await mangopayService.createDirectPayIn({
      mpUserId: parsed.mpUserId,
      walletId: parsed.walletId,
      cardId: finalized.CardId,
      amountMinor: order.amountMinor,
      currency: order.currency,
    });

    order.providerRef = payIn.Id;
    if (payIn.Status !== 'SUCCEEDED') {
      order.status = 'failed';
      order.events.push({ status: 'failed', message: `Mangopay PayIn status: ${payIn.Status}` });
      await order.save();
      return res.status(402).json({ error: 'Payment not completed', order });
    }

    order.status = 'processing';
    order.events.push({ status: 'processing', message: 'Mangopay PayIn succeeded' });
    await order.save();
    await publishOrderCreated(order);
    await clearCart(req.user._id);
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

async function clearCart(userId) {
  await Cart.findOneAndUpdate({ user: userId }, { items: [] });
}
