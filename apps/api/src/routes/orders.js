import { Router } from 'express';
import { Order } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

ordersRouter.get('/', async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ orders });
});

ordersRouter.get('/:id', async (req, res) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) return res.status(404).json({ error: 'Order not found' });
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});
