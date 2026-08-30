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
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.status === 'pending') {
        order.status = 'processing';
        order.events.push({ status: 'processing', message: 'Stripe webhook: payment succeeded' });
        await order.save();
        await publishOrderCreated(order);
      }
    }
  }

  res.json({ received: true });
});
