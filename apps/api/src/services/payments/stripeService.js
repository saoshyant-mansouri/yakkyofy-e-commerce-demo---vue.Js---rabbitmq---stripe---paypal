import Stripe from 'stripe';
import { env } from '../../config/env.js';

let stripeClient;
function getClient() {
  if (!stripeClient) stripeClient = new Stripe(env.stripe.secretKey);
  return stripeClient;
}

/** Creates a PaymentIntent for the given integer minor-unit amount + ISO currency. */
export async function createPaymentIntent({ amountMinor, currency, orderId }) {
  const stripe = getClient();
  // Restricted to the classic `card` payment method (rather than
  // automatic_payment_methods) so the client can use the Card Element +
  // confirmCardPayment and never has to handle a redirect-based return flow
  // — simpler and more reliable for a minimal demo.
  const intent = await stripe.paymentIntents.create({
    amount: amountMinor,
    currency: currency.toLowerCase(),
    metadata: { orderId },
    payment_method_types: ['card'],
  });
  return { providerRef: intent.id, clientSecret: intent.client_secret };
}

export function constructWebhookEvent(rawBody, signature) {
  const stripe = getClient();
  return stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
}

export async function retrievePaymentIntent(id) {
  const stripe = getClient();
  return stripe.paymentIntents.retrieve(id);
}
