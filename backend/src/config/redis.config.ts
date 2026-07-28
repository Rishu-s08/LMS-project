import { Redis } from 'ioredis';
import { env } from './config.js';
import { logger } from '../shared/utils/logger.util.js';

const REDIS_URL = env.REDIS_URL;

export const redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn({ attempt: times, delayMs: delay }, "Redis reconnecting");
        return delay;
    },
    reconnectOnError(err) {
        if (err.message.includes("READONLY")) {
            return true;
        }
        return false;
    }
});

redisClient.on('connect', () => {
    logger.info("Redis connected");
});

redisClient.on('error', (err) => {
    logger.error({ err: err.message }, "Redis connection error");
});
