import { Router } from 'express';
import { Order } from '../models/index.js';
import { constructWebhookEvent } from '../services/payments/stripeService.js';
import { publishOrderCreated } from '../services/amqp.js';
import { logger } from '../config/logger.js';

export const webhooksRouter = Router();

// Mounted with express.raw() in app.js — Stripe signature verification needs
// the exact raw request body, not the JSON-parsed one.
webhooksRouter.post('/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    logger.warn({ err }, 'Stripe webhook signature verification failed');
    return res.status(400).send('Webhook signature verification failed');
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const orderId = intent.metadata?.orderId;
    if (orderId && /^[0-9a-fA-F]{24}$/.test(orderId)) {
      // Atomic pending -> processing, matched on this exact intent, so the webhook and the client's
      // /checkout/stripe/confirm can't both publish the order.
      const order = await Order.findOneAndUpdate(
        { _id: orderId, status: 'pending', provider: 'stripe', providerRef: intent.id, amountMinor: intent.amount },
        {
          $set: { status: 'processing' },
          $push: { events: { status: 'processing', message: 'Stripe webhook: payment succeeded' } },
        },
        { new: true }
      );
      if (order) await publishOrderCreated(order);
    }
  }

  res.json({ received: true });
});
