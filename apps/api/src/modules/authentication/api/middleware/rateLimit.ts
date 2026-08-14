import rateLimit, { Store } from 'express-rate-limit';
import { RedisStore, RedisReply } from 'rate-limit-redis';
import { getRedisClient } from '../../../../shared/cache/redisClient';

type RawSendCommand = (...args: string[]) => Promise<RedisReply>;

/**
 * Redis-backed store when REDIS_URL is configured, otherwise falls back to
 * express-rate-limit's default in-memory store (same behavior as before
 * Redis existed). In-memory buckets are per-process — fine for a single
 * Railway instance, but reset on every deploy/restart and don't share state
 * across instances. The Redis store fixes both: limits persist across
 * restarts and are shared if this ever runs on more than one instance.
 */
function redisStoreIfAvailable(prefix: string): Store | undefined {
  const redis = getRedisClient();
  if (!redis) return undefined;

  return new RedisStore({
    prefix,
    // rate-limit-redis's documented adapter for ioredis: forward raw
    // command args to ioredis's low-level `call`. Cast is needed because
    // ioredis's own overloads for `call` aren't a plain rest-args signature.
    sendCommand: (redis.call.bind(redis) as unknown) as RawSendCommand,
  }) as unknown as Store;
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  store: redisStoreIfAvailable('rl:auth:'),
});

export const verificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  store: redisStoreIfAvailable('rl:verify:'),
});
