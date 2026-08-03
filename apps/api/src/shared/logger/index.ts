import pino from 'pino';
import type { Options } from 'pino-http';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

/**
 * Headers safe to log. Everything else is dropped.
 *
 * Deliberately an ALLOWLIST, not a denylist of sensitive names. A denylist
 * fails open: the day someone introduces `x-api-key` or `x-session-token`, it
 * leaks into logs until a human notices. An allowlist fails closed — a new
 * header simply is not logged until it is consciously added here.
 *
 * This matters because Phase 0 introduces HTTP-only authentication cookies.
 * Under pino-http's default serializer, every request would log its `cookie`
 * header, writing a session credential to persistent storage on every call.
 */
const LOGGABLE_REQUEST_HEADERS = ['host', 'user-agent', 'content-type', 'content-length'] as const;

function pickLoggableHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const name of LOGGABLE_REQUEST_HEADERS) {
    if (headers[name] !== undefined) {
      safe[name] = headers[name];
    }
  }
  return safe;
}

/**
 * pino-http configuration.
 *
 * Replaces the default request/response serializers, which log the complete
 * header collection. Retains the fields that make logs operationally useful
 * (method, url, status, timing) while excluding credential-bearing ones.
 */
export const httpLoggerOptions: Options = {
  logger,
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        headers: pickLoggableHeaders(req.headers as Record<string, unknown>),
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      // Response headers are omitted entirely: they carry Set-Cookie once
      // authentication exists, and nothing in them aids routine diagnosis.
      return { statusCode: res.statusCode };
    },
  },
};
