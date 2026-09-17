// No dotenv init here: `config/db` (below) transitively imports
// `@yakkyofy-demo/api/config/env`, which loads the shared repo-root .env —
// ES module import evaluation always runs a module's imports before its own
// top-level code, so `env` is fully populated before anything in this file
// (including main()) actually runs.
import { connectDb } from '@yakkyofy-demo/api/config/db';
import { logger } from '@yakkyofy-demo/api/config/logger';
import { Order, Product } from '@yakkyofy-demo/api/models';
import {
  connectAmqp,
  QUEUE_PROCESS,
  QUEUE_FULFILL,
  EXCHANGE,
  ROUTING_KEY_PROCESSED_OK,
} from '@yakkyofy-demo/api/services/amqp';

// Stage 1: "order.process" — verifies stock, decrements it, and transitions
// the order processing -> paid|failed. On success, republishes so the
// fulfillment stage can pick it up. This mirrors the real Yakkyofy async
// job pipeline (multi-stage queue consumers reacting to order lifecycle
// events) found during the earlier architecture review.
async function handleProcess(channel, msg) {
  const { orderId } = JSON.parse(msg.content.toString());
  const order = await Order.findById(orderId);
  if (!order) {
    logger.warn({ orderId }, 'order.process: order not found, dropping');
    return channel.ack(msg);
  }
  if (order.status !== 'processing') {
    logger.info({ orderId, status: order.status }, 'order.process: skipping, not in processing state');
    return channel.ack(msg);
  }

  // Each decrement only applies if enough stock remains at that instant, so two orders processed
  // concurrently can't both take the last unit. On a shortfall, already-reserved lines are put back.
  const reserved = [];
  try {
    for (const item of order.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } }
      );
      if (!updated) throw new Error(`Insufficient stock for ${item.title}`);
      reserved.push(item);
    }

    order.status = 'paid';
    order.events.push({ status: 'paid', message: 'Stock reserved, payment settled' });
    await order.save();
    logger.info({ orderId }, 'Order marked paid');

    channel.publish(
      EXCHANGE,
      ROUTING_KEY_PROCESSED_OK,
      Buffer.from(JSON.stringify({ orderId })),
      { persistent: true }
    );
    channel.ack(msg);
  } catch (err) {
    logger.error({ err, orderId }, 'order.process failed');
    for (const item of reserved) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
    }
    order.status = 'failed';
    order.events.push({ status: 'failed', message: err.message });
    await order.save();
    // Business-logic failure, not a transient infra error — ack so it
    // doesn't loop, the failure is already recorded on the order itself.
    channel.ack(msg);
  }
}

// Stage 2: "order.fulfill" — mock warehouse handoff, just appends an event.
async function handleFulfill(channel, msg) {
  const { orderId } = JSON.parse(msg.content.toString());
  const order = await Order.findById(orderId);
  if (!order) return channel.ack(msg);

  order.events.push({ status: order.status, message: 'Mock fulfillment: handed to carrier' });
  await order.save();
  logger.info({ orderId }, 'Order fulfillment event recorded');
  channel.ack(msg);
}

async function main() {
  await connectDb();
  const channel = await connectAmqp();
  channel.prefetch(5);

  channel.consume(QUEUE_PROCESS, (msg) => {
    if (msg) handleProcess(channel, msg).catch((err) => logger.error({ err }, 'handleProcess crashed'));
  });
  channel.consume(QUEUE_FULFILL, (msg) => {
    if (msg) handleFulfill(channel, msg).catch((err) => logger.error({ err }, 'handleFulfill crashed'));
  });

  logger.info('Worker listening on order.process and order.fulfill queues');
}

main().catch((err) => {
  logger.error({ err }, 'Worker fatal startup error');
  process.exit(1);
});
