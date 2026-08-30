import { Router } from 'express';
import { getRates, SUPPORTED_CURRENCIES } from '../services/currencyService.js';

export const currenciesRouter = Router();

currenciesRouter.get('/', async (req, res) => {
  const rates = await getRates();
  res.json({ base: 'EUR', currencies: SUPPORTED_CURRENCIES, rates });
});
