import amqplib from 'amqplib';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const EXCHANGE = 'orders';
export const ROUTING_KEY_CREATED = 'order.created';
export const ROUTING_KEY_PROCESSED_OK = 'order.processing.ok';
export const QUEUE_PROCESS = 'order.process';
export const QUEUE_FULFILL = 'order.fulfill';
export const QUEUE_DLQ = 'orders.dlq';

let channelPromise;

/**
 * Connects to RabbitMQ and asserts the full topology (exchange + queues +
 * bindings + dead-letter routing). Safe to call from both the API (to
 * publish) and the worker (to consume) — asserts are idempotent.
 */
export async function connectAmqp() {
  const conn = await amqplib.connect(env.rabbitUrl);
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUE_DLQ, { durable: true });

  await channel.assertQueue(QUEUE_PROCESS, {
    durable: true,
    deadLetterExchange: '',
    deadLetterRoutingKey: QUEUE_DLQ,
  });
  await channel.bindQueue(QUEUE_PROCESS, EXCHANGE, ROUTING_KEY_CREATED);

  await channel.assertQueue(QUEUE_FULFILL, {
    durable: true,
    deadLetterExchange: '',
    deadLetterRoutingKey: QUEUE_DLQ,
  });
  await channel.bindQueue(QUEUE_FULFILL, EXCHANGE, ROUTING_KEY_PROCESSED_OK);

  conn.on('error', (err) => logger.error({ err }, 'AMQP connection error'));
  conn.on('close', () => {
    logger.warn('AMQP connection closed, will reconnect on next publish');
    channelPromise = null;
  });

  return channel;
}

async function getChannel() {
  if (!channelPromise) channelPromise = connectAmqp();
  return channelPromise;
}

export async function publishOrderCreated(order) {
  const channel = await getChannel();
  const payload = Buffer.from(JSON.stringify({ orderId: order._id.toString() }));
  channel.publish(EXCHANGE, ROUTING_KEY_CREATED, payload, { persistent: true });
  logger.info({ orderId: order._id.toString() }, 'Published order.created');
}
