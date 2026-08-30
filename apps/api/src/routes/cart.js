import { Router } from 'express';
import { z } from 'zod';
import { Cart, Product } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { getRates, convertMinor, SUPPORTED_CURRENCIES } from '../services/currencyService.js';

export const cartRouter = Router();
cartRouter.use(requireAuth);

async function serializeCart(cart, currency) {
  if (!cart || cart.items.length === 0) {
    return { items: [], currency, subtotalMinor: 0 };
  }
  const rates = await getRates();
  const items = [];
  let subtotalMinor = 0;

  for (const item of cart.items) {
    const product = item.product?.title ? item.product : await Product.findById(item.product).lean();
    if (!product) continue;
    const unitPriceMinor = convertMinor(product.basePriceMinor, currency, rates);
    const lineTotalMinor = unitPriceMinor * item.qty;
    subtotalMinor += lineTotalMinor;
    items.push({
      product: { _id: product._id, title: product.title, slug: product.slug, images: product.images },
      qty: item.qty,
      unitPriceMinor,
      lineTotalMinor,
    });
  }
  return { items, currency, subtotalMinor };
}

cartRouter.get('/', async (req, res) => {
  const currency = SUPPORTED_CURRENCIES.includes(req.query.currency) ? req.query.currency : 'EUR';
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product').lean();
  res.json(await serializeCart(cart, currency));
});

const addSchema = z.object({
  productId: z.string().length(24),
  qty: z.coerce.number().int().min(1).max(99).default(1),
});

cartRouter.post('/items', async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { productId, qty } = parsed.data;

  const product = await Product.findById(productId).lean();
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { user: req.user._id, items: [] } },
    { upsert: true, new: true }
  );

  const existing = cart.items.find((i) => i.product.toString() === productId);
  if (existing) existing.qty += qty;
  else cart.items.push({ product: productId, qty });
  await cart.save();

  const currency = SUPPORTED_CURRENCIES.includes(req.query.currency) ? req.query.currency : 'EUR';
  const populated = await cart.populate('items.product');
  res.status(201).json(await serializeCart(populated.toObject(), currency));
});

const updateSchema = z.object({ qty: z.coerce.number().int().min(1).max(99) });

cartRouter.patch('/items/:productId', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });

  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) return res.status(404).json({ error: 'Item not in cart' });
  item.qty = parsed.data.qty;
  await cart.save();

  const currency = SUPPORTED_CURRENCIES.includes(req.query.currency) ? req.query.currency : 'EUR';
  const populated = await cart.populate('items.product');
  res.json(await serializeCart(populated.toObject(), currency));
});

cartRouter.delete('/items/:productId', async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });

  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();

  const currency = SUPPORTED_CURRENCIES.includes(req.query.currency) ? req.query.currency : 'EUR';
  const populated = await cart.populate('items.product');
  res.json(await serializeCart(populated.toObject(), currency));
});
