import { describe, expect, it, vi } from 'vitest';
import { InProcessEventPublisher } from './EventPublisher';
import { createDomainEvent } from './DomainEvent';

function testEvent(eventType = 'TestHappened') {
  return createDomainEvent({
    eventType,
    aggregateId: 'agg-1',
    aggregateType: 'Test',
    payload: { value: 1 },
  });
}

describe('InProcessEventPublisher', () => {
  it('delivers an event to a matching subscriber', async () => {
    const publisher = new InProcessEventPublisher();
    const subscriber = vi.fn();
    publisher.subscribe('TestHappened', subscriber);

    const event = testEvent();
    await publisher.publish(event);

    expect(subscriber).toHaveBeenCalledOnce();
    expect(subscriber).toHaveBeenCalledWith(event);
  });

  it('delivers to every subscriber of the same event type', async () => {
    const publisher = new InProcessEventPublisher();
    const first = vi.fn();
    const second = vi.fn();
    publisher.subscribe('TestHappened', first);
    publisher.subscribe('TestHappened', second);

    await publisher.publish(testEvent());

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('does not deliver to subscribers of other event types', async () => {
    const publisher = new InProcessEventPublisher();
    const unrelated = vi.fn();
    publisher.subscribe('SomethingElseHappened', unrelated);

    await publisher.publish(testEvent());

    expect(unrelated).not.toHaveBeenCalled();
  });

  it('publishing with no subscribers is a no-op, not an error', async () => {
    const publisher = new InProcessEventPublisher();
    await expect(publisher.publish(testEvent())).resolves.toBeUndefined();
  });

  it('isolates subscriber failures so others still run', async () => {
    const onSubscriberError = vi.fn();
    const publisher = new InProcessEventPublisher(onSubscriberError);
    const failing = vi.fn(() => {
      throw new Error('subscriber exploded');
    });
    const healthy = vi.fn();

    publisher.subscribe('TestHappened', failing);
    publisher.subscribe('TestHappened', healthy);

    // Must not reject — a subscriber failure cannot invalidate the
    // originating business transaction.
    await expect(publisher.publish(testEvent())).resolves.toBeUndefined();

    expect(healthy).toHaveBeenCalledOnce();
    expect(onSubscriberError).toHaveBeenCalledOnce();
  });
});

describe('createDomainEvent', () => {
  it('populates every metadata field required by Constitution Article 18', () => {
    const event = testEvent();

    expect(event.eventId).toBeTruthy();
    expect(event.eventType).toBe('TestHappened');
    expect(event.aggregateId).toBe('agg-1');
    expect(event.aggregateType).toBe('Test');
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.version).toBe(1);
    expect(event.correlationId).toBeTruthy();
    expect(event.payload).toEqual({ value: 1 });
  });

  it('assigns a unique eventId per event', () => {
    expect(testEvent().eventId).not.toBe(testEvent().eventId);
  });

  it('is immutable once created (Article 18)', () => {
    const event = testEvent();
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.payload)).toBe(true);
  });
});
