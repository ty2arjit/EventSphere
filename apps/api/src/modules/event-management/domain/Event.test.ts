import { describe, it, expect } from 'vitest';
import { Event } from './Event';
import { InvalidTransitionError, EventReadOnlyError, SessionRequiresLiveEventError } from './errors';

function createTestEvent() {
  return Event.create({
    communityId: 'comm-1',
    name: 'Tech Conference 2026',
    slug: 'tech-conf-2026',
    description: 'Annual tech conference',
  });
}

describe('Event aggregate', () => {
  describe('creation', () => {
    it('creates in Draft state with an EventCreated event', () => {
      const event = createTestEvent();
      expect(event.state).toBe('Draft');
      expect(event.communityId).toBe('comm-1');
      const events = event.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]!.eventType).toBe('EventCreated');
    });
  });

  describe('lifecycle FSM', () => {
    it('follows the happy path: Draft → Published → RegOpen → RegClosed → Live → Completed → Archived', () => {
      const event = createTestEvent();
      event.pullDomainEvents();

      event.publish();
      expect(event.state).toBe('Published');
      expect(event.pullDomainEvents()[0]!.eventType).toBe('EventPublished');

      event.openRegistration();
      expect(event.state).toBe('RegistrationOpen');

      event.closeRegistration();
      expect(event.state).toBe('RegistrationClosed');

      event.goLive();
      expect(event.state).toBe('Live');

      event.complete();
      expect(event.state).toBe('Completed');

      event.archive();
      expect(event.state).toBe('Archived');
    });

    it('allows Draft → Cancelled', () => {
      const event = createTestEvent();
      event.cancel();
      expect(event.state).toBe('Cancelled');
    });

    it('allows Published → Cancelled', () => {
      const event = createTestEvent();
      event.publish();
      event.cancel();
      expect(event.state).toBe('Cancelled');
    });

    it('rejects invalid transitions', () => {
      const event = createTestEvent();
      expect(() => event.goLive()).toThrow(InvalidTransitionError);
      expect(() => event.complete()).toThrow(InvalidTransitionError);
    });

    it('rejects transitions from terminal states', () => {
      const event = createTestEvent();
      event.cancel();
      expect(() => event.publish()).toThrow(InvalidTransitionError);
    });

    it('archived events are read-only', () => {
      const event = createTestEvent();
      event.publish();
      event.openRegistration();
      event.closeRegistration();
      event.goLive();
      event.complete();
      event.archive();
      expect(() => event.updateProfile({ name: 'New Name' })).toThrow(EventReadOnlyError);
    });
  });

  describe('sessions', () => {
    it('adds a session', () => {
      const event = createTestEvent();
      const session = event.addSession('Keynote', 'Opening keynote');
      expect(session.title).toBe('Keynote');
      expect(event.sessions).toHaveLength(1);
    });

    it('cannot start session unless event is Live', () => {
      const event = createTestEvent();
      const session = event.addSession('Talk', null);
      session.schedule({ startAt: new Date('2026-09-01T10:00:00Z'), endAt: new Date('2026-09-01T11:00:00Z') });
      session.markReady();
      expect(() => event.startSession(session.id)).toThrow(SessionRequiresLiveEventError);
    });

    it('can start session when event is Live', () => {
      const event = createTestEvent();
      const session = event.addSession('Talk', null);
      session.schedule({ startAt: new Date('2026-09-01T10:00:00Z'), endAt: new Date('2026-09-01T11:00:00Z') });
      session.markReady();
      event.publish();
      event.openRegistration();
      event.closeRegistration();
      event.goLive();
      event.startSession(session.id);
      expect(session.state).toBe('Live');
    });
  });

  describe('updates', () => {
    it('updates profile fields', () => {
      const event = createTestEvent();
      event.updateProfile({ name: 'New Name', tags: ['ai', 'ml'] });
      expect(event.name).toBe('New Name');
      expect(event.tags).toEqual(['ai', 'ml']);
    });

    it('validates capacity', () => {
      const event = createTestEvent();
      expect(() => event.updateCapacity({ min: 100, max: 50 })).toThrow();
    });

    it('updates location', () => {
      const event = createTestEvent();
      event.updateLocation({ venue: 'Hall A', address: '123 Main St', city: 'NYC', onlineUrl: null });
      expect(event.location.venue).toBe('Hall A');
    });
  });
});
