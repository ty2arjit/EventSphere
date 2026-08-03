import { randomUUID } from 'node:crypto';

/**
 * A Domain Event is an immutable record of a business fact that has ALREADY
 * happened (Constitution Article 17 — facts, never commands; Article 18 —
 * immutable once published).
 *
 * Metadata fields are mandated by Constitution Article 18. `readonly` on every
 * field plus `Readonly<T>` on the payload enforces immutability at compile time.
 *
 * Pure TypeScript — no framework imports, safe for the Domain layer.
 */
export interface DomainEvent<TPayload = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly version: number;
  readonly correlationId: string;
  readonly payload: Readonly<TPayload>;
}

export interface CreateDomainEventInput<TPayload> {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: TPayload;
  /**
   * Ties related events across one logical operation together. Not yet wired
   * to a per-request identifier — request-scoped propagation arrives when
   * cross-context flows do (Phase 0+). Generated per event until then, so the
   * field is always populated as Article 18 requires.
   */
  correlationId?: string;
  version?: number;
}

export function createDomainEvent<TPayload>(
  input: CreateDomainEventInput<TPayload>,
): DomainEvent<TPayload> {
  return Object.freeze({
    eventId: randomUUID(),
    eventType: input.eventType,
    aggregateId: input.aggregateId,
    aggregateType: input.aggregateType,
    occurredAt: new Date(),
    version: input.version ?? 1,
    correlationId: input.correlationId ?? randomUUID(),
    payload: Object.freeze(input.payload),
  });
}
