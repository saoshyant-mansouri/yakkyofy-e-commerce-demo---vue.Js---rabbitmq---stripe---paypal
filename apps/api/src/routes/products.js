import { Router } from 'express';
import { z } from 'zod';
import { Product } from '../models/index.js';
import { getRates, convertMinor, SUPPORTED_CURRENCIES } from '../services/currencyService.js';
import { requireAuth } from '../middleware/auth.js';

export const productsRouter = Router();
// Catalog is only visible to signed-in users — a frontend route guard alone
// isn't enough since these endpoints are reachable directly.
productsRouter.use(requireAuth);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  category: z.string().optional(),
  q: z.string().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).default('EUR'),
});

async function withDisplayPrice(products, currency) {
  const rates = await getRates();
  return products.map((p) => ({
    ...p,
    displayCurrency: currency,
    displayPriceMinor: convertMinor(p.basePriceMinor, currency, rates),
  }));
}

productsRouter.get('/', async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });
  const { page, limit, category, q, currency } = parsed.data;

  const filter = {};
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    items: await withDisplayPrice(items, currency),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

productsRouter.get('/categories', async (req, res) => {
  const categories = await Product.distinct('category');
  res.json({ categories });
});

productsRouter.get('/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  const currency = SUPPORTED_CURRENCIES.includes(req.query.currency) ? req.query.currency : 'EUR';

  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrSlug } : { slug: idOrSlug };
  const product = await Product.findOne(query).lean();
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const [withPrice] = await withDisplayPrice([product], currency);
  res.json({ product: withPrice });
});
