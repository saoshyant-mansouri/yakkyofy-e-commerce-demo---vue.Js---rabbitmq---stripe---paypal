import { env } from '../../config/env.js';

// Implemented against PayPal's official REST v2 Orders API directly
// (https://developer.paypal.com/docs/api/orders/v2/) rather than the
// @paypal/paypal-server-sdk wrapper package, which as of this writing only
// covers a handful of endpoints and lacks a stable, documented method
// surface to build against reliably. The REST API itself is the same one
// every PayPal SDK calls under the hood.

const BASE_URL =
  env.paypal.env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

let cachedToken = null; // { value, expiresAt }

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.value;
  }
  const basicAuth = Buffer.from(`${env.paypal.clientId}:${env.paypal.clientSecret}`).toString(
    'base64'
  );
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

/** amountMinor is integer cents; PayPal wants a decimal string like "19.99". */
function minorToDecimalString(amountMinor, currency) {
  // PayPal, like most currencies here, uses 2 decimal places.
  return (amountMinor / 100).toFixed(2);
}

export async function createOrder({ amountMinor, currency, orderId }) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': orderId,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          amount: { currency_code: currency, value: minorToDecimalString(amountMinor, currency) },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`PayPal create order failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { providerRef: data.id };
}

export async function captureOrder(paypalOrderId) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${res.status} ${await res.text()}`);
  return res.json();
}
