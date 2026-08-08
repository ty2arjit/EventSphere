import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/events/DomainEvent';
import { EventLifecycleState, canTransition, isTerminal } from './valueObjects/EventLifecycleState';
import { EventMode } from './valueObjects/EventMode';
import { EventVisibility } from './valueObjects/EventVisibility';
import { Location } from './valueObjects/Location';
import { Capacity, validateCapacity } from './valueObjects/Capacity';
import { Session } from './entities/Session';
import { EventSettings } from './entities/EventSettings';
import { InvalidTransitionError, EventReadOnlyError, SessionNotFoundError, SessionRequiresLiveEventError } from './errors';
import { makeEventCreated } from './events/EventCreated';
import { makeEventPublished } from './events/EventPublished';
import { makeLifecycleEvent, REGISTRATION_OPENED, REGISTRATION_CLOSED, EVENT_STARTED, EVENT_COMPLETED, EVENT_ARCHIVED, EVENT_CANCELLED } from './events/EventLifecycleChanged';
import { makeSessionEvent, SESSION_CREATED } from './events/SessionEvents';

export interface EventProps {
  id: string;
  communityId: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  tags: string[];
  mode: EventMode;
  visibility: EventVisibility;
  location: Location;
  capacity: Capacity;
  startDate: Date | null;
  endDate: Date | null;
  state: EventLifecycleState;
  settings: EventSettings;
  sessions: Session[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreateEventInput {
  communityId: string;
  name: string;
  slug: string;
  description?: string | null;
  mode?: EventMode;
  visibility?: EventVisibility;
}

export class Event {
  private readonly pendingEvents: DomainEvent[] = [];

  private constructor(private readonly props: EventProps) {}

  static create(input: CreateEventInput): Event {
    const now = new Date();
    const event = new Event({
      id: randomUUID(),
      communityId: input.communityId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      category: null,
      tags: [],
      mode: input.mode ?? 'Offline',
      visibility: input.visibility ?? 'Public',
      location: { venue: null, address: null, city: null, onlineUrl: null },
      capacity: { min: null, max: null },
      startDate: null,
      endDate: null,
      state: 'Draft',
      settings: EventSettings.defaults(),
      sessions: [],
      createdAt: now,
      updatedAt: now,
    });
    event.pendingEvents.push(makeEventCreated(event.id, input.communityId, input.name));
    return event;
  }

  static fromPersistence(props: EventProps): Event {
    return new Event(props);
  }

  pullDomainEvents(): DomainEvent[] {
    return this.pendingEvents.splice(0, this.pendingEvents.length);
  }

  // --- Getters ---
  get id(): string { return this.props.id; }
  get communityId(): string { return this.props.communityId; }
  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get description(): string | null { return this.props.description; }
  get category(): string | null { return this.props.category; }
  get tags(): readonly string[] { return this.props.tags; }
  get mode(): EventMode { return this.props.mode; }
  get visibility(): EventVisibility { return this.props.visibility; }
  get location(): Location { return this.props.location; }
  get capacity(): Capacity { return this.props.capacity; }
  get startDate(): Date | null { return this.props.startDate; }
  get endDate(): Date | null { return this.props.endDate; }
  get state(): EventLifecycleState { return this.props.state; }
  get settings(): EventSettings { return this.props.settings; }
  get sessions(): readonly Session[] { return this.props.sessions; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  private touch(): void { this.props.updatedAt = new Date(); }

  private ensureWritable(): void {
    if (isTerminal(this.props.state)) throw new EventReadOnlyError();
  }

  // --- Profile updates ---
  updateProfile(fields: {
    name?: string;
    description?: string | null;
    category?: string | null;
    tags?: string[];
    mode?: EventMode;
    visibility?: EventVisibility;
  }): void {
    this.ensureWritable();
    if (fields.name !== undefined) this.props.name = fields.name;
    if (fields.description !== undefined) this.props.description = fields.description;
    if (fields.category !== undefined) this.props.category = fields.category;
    if (fields.tags !== undefined) this.props.tags = fields.tags;
    if (fields.mode !== undefined) this.props.mode = fields.mode;
    if (fields.visibility !== undefined) this.props.visibility = fields.visibility;
    this.touch();
  }

  updateLocation(location: Location): void {
    this.ensureWritable();
    this.props.location = location;
    this.touch();
  }

  updateCapacity(capacity: Capacity): void {
    this.ensureWritable();
    validateCapacity(capacity);
    this.props.capacity = capacity;
    this.touch();
  }

  updateDates(startDate: Date, endDate: Date): void {
    this.ensureWritable();
    if (startDate >= endDate) throw new Error('Start date must precede end date');
    this.props.startDate = startDate;
    this.props.endDate = endDate;
    this.touch();
  }

  updateSettings(fields: Parameters<EventSettings['update']>[0]): void {
    this.ensureWritable();
    this.props.settings.update(fields);
    this.touch();
  }

  // --- Lifecycle FSM ---
  private transitionTo(newState: EventLifecycleState): void {
    if (!canTransition(this.props.state, newState)) {
      throw new InvalidTransitionError(this.props.state, newState);
    }
    const from = this.props.state;
    this.props.state = newState;
    this.touch();
    return this.emitLifecycleEvent(from, newState);
  }

  private emitLifecycleEvent(from: EventLifecycleState, to: EventLifecycleState): void {
    const eventTypeMap: Record<string, string> = {
      Published: 'EventPublished',
      RegistrationOpen: REGISTRATION_OPENED,
      RegistrationClosed: REGISTRATION_CLOSED,
      Live: EVENT_STARTED,
      Completed: EVENT_COMPLETED,
      Archived: EVENT_ARCHIVED,
      Cancelled: EVENT_CANCELLED,
    };
    const eventType = eventTypeMap[to];
    if (eventType === 'EventPublished') {
      this.pendingEvents.push(makeEventPublished(this.id));
    } else if (eventType) {
      this.pendingEvents.push(makeLifecycleEvent(eventType, this.id, from, to));
    }
  }

  publish(): void { this.transitionTo('Published'); }
  openRegistration(): void { this.transitionTo('RegistrationOpen'); }
  closeRegistration(): void { this.transitionTo('RegistrationClosed'); }
  goLive(): void { this.transitionTo('Live'); }
  complete(): void { this.transitionTo('Completed'); }
  archive(): void { this.transitionTo('Archived'); }
  cancel(): void { this.transitionTo('Cancelled'); }

  // --- Sessions ---
  addSession(title: string, description: string | null): Session {
    this.ensureWritable();
    const session = Session.create(this.id, title, description);
    this.props.sessions.push(session);
    this.pendingEvents.push(makeSessionEvent(SESSION_CREATED, session.id, this.id));
    this.touch();
    return session;
  }

  findSession(sessionId: string): Session | undefined {
    return this.props.sessions.find((s) => s.id === sessionId);
  }

  getSession(sessionId: string): Session {
    const session = this.findSession(sessionId);
    if (!session) throw new SessionNotFoundError(sessionId);
    return session;
  }

  startSession(sessionId: string): void {
    if (this.props.state !== 'Live') throw new SessionRequiresLiveEventError();
    this.getSession(sessionId).goLive();
    this.touch();
  }
}
