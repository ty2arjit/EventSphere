import Redis from "ioredis";
import { logger } from "../logger";

let client: Redis | null | undefined;

/**
 * Lazily-constructed singleton, inert (returns null) until REDIS_URL is set —
 * same activation pattern as the Mailer/Cloudinary integrations. Lazy rather
 * than a module-top-level side effect so importing this file never opens a
 * connection attempt during tests, which never set REDIS_URL.
 */
export function getRedisClient(): Redis | null {
  if (client !== undefined) return client;

  const url = process.env.REDIS_URL;
  if (!url) {
    client = null;
    return client;
  }

  client = new Redis(url, {
    maxRetriesPerRequest: 2,
    // Never throw on a transient connection blip — every caller treats a
    // cache/rate-limit-store failure as "fall through to the uncached path",
    // never as a request failure (Constitution: cache is never the source
    // of truth).
    lazyConnect: false,
  });

  client.on("error", (err) => {
    logger.error({ err }, "Redis connection error");
  });

  client.on("connect", () => {
    logger.info("Redis connected");
  });

  return client;
}
