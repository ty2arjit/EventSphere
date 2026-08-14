/** The subset of ioredis's client the cache decorators actually need — kept
 * narrow so tests can supply a trivial in-memory fake instead of mocking
 * ioredis. */
export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: "EX", seconds: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
}
