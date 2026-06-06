import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

let connection;

export const getRedisConnection = () => {
  if (!connection) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl || redisUrl.includes('your_ultramsg')) {
      // Fallback to localhost for dev
      connection = new IORedis({
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null
      });
    } else {
      connection = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        tls: redisUrl.startsWith('rediss://') ? {} : undefined
      });
    }

    connection.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    connection.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }

  return connection;
};

export const createQueue = (name) => {
  return new Queue(name, { connection: getRedisConnection() });
};

export const createWorker = (name, processor) => {
  return new Worker(name, processor, { connection: getRedisConnection() });
};
