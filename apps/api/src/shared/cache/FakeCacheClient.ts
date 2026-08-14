import type { CacheClient } from "./CacheClient";

/** In-memory double for CacheClient — used by cache-decorator tests instead
 * of mocking ioredis. Not exported from any module's public index; import
 * directly from this file in tests. */
export class FakeCacheClient implements CacheClient {
  private store = new Map<string, string>();
  getCalls = 0;
  setCalls = 0;
  delCalls = 0;

  async get(key: string): Promise<string | null> {
    this.getCalls += 1;
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.setCalls += 1;
    this.store.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.delCalls += 1;
    this.store.delete(key);
  }
}
