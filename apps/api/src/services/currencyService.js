import { env } from '../config/env.js';
import { FxRate } from '../models/index.js';
import { logger } from '../config/logger.js';

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD'];

// Static fallback so the app works fully offline / local without network access.
const STATIC_RATES = { EUR: 1, USD: 1.08, GBP: 0.86, CAD: 1.47 };

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function getRates() {
  const cached = await FxRate.findOne({ base: 'EUR' });
  const isFresh = cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS;
  if (isFresh) return cached.rates;

  if (env.fx.apiUrl) {
    try {
      const res = await fetch(env.fx.apiUrl);
      const data = await res.json();
      const rates = data.rates || data.conversion_rates;
      if (rates) {
        const picked = Object.fromEntries(
          SUPPORTED_CURRENCIES.map((c) => [c, rates[c] ?? STATIC_RATES[c]])
        );
        await FxRate.findOneAndUpdate(
          { base: 'EUR' },
          { base: 'EUR', rates: picked, fetchedAt: new Date() },
          { upsert: true }
        );
        return picked;
      }
    } catch (err) {
      logger.warn({ err }, 'FX rate fetch failed, using static fallback');
    }
  }

  if (cached) return cached.rates;
  return STATIC_RATES;
}

/** Convert an integer minor-unit amount (cents) from EUR to `currency`. */
export function convertMinor(amountMinorEur, currency, rates) {
  const rate = rates[currency] ?? 1;
  return Math.round(amountMinorEur * rate);
}
