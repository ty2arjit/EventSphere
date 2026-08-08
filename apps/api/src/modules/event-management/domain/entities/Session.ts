import { randomUUID } from 'node:crypto';
import { SessionLifecycleState, canTransitionSession } from '../valueObjects/SessionLifecycleState';
import { TimeSlot, validateTimeSlot } from '../valueObjects/TimeSlot';
import { InvalidTransitionError } from '../errors';

export interface SessionProps {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  speaker: string | null;
  room: string | null;
  startAt: Date | null;
  endAt: Date | null;
  state: SessionLifecycleState;
  createdAt: Date;
  updatedAt: Date;
}

export class Session {
  constructor(private readonly props: SessionProps) {}

  static create(eventId: string, title: string, description: string | null): Session {
    const now = new Date();
    return new Session({
      id: randomUUID(),
      eventId,
      title,
      description,
      speaker: null,
      room: null,
      startAt: null,
      endAt: null,
      state: 'Draft',
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: SessionProps): Session {
    return new Session(props);
  }

  get id(): string { return this.props.id; }
  get eventId(): string { return this.props.eventId; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get speaker(): string | null { return this.props.speaker; }
  get room(): string | null { return this.props.room; }
  get startAt(): Date | null { return this.props.startAt; }
  get endAt(): Date | null { return this.props.endAt; }
  get state(): SessionLifecycleState { return this.props.state; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  private touch(): void { this.props.updatedAt = new Date(); }

  update(fields: { title?: string; description?: string | null; speaker?: string | null; room?: string | null }): void {
    if (fields.title !== undefined) this.props.title = fields.title;
    if (fields.description !== undefined) this.props.description = fields.description;
    if (fields.speaker !== undefined) this.props.speaker = fields.speaker;
    if (fields.room !== undefined) this.props.room = fields.room;
    this.touch();
  }

  schedule(slot: TimeSlot): void {
    validateTimeSlot(slot);
    this.props.startAt = slot.startAt;
    this.props.endAt = slot.endAt;
    this.transitionTo('Scheduled');
  }

  markReady(): void { this.transitionTo('Ready'); }
  goLive(): void { this.transitionTo('Live'); }
  complete(): void { this.transitionTo('Completed'); }
  cancel(): void { this.transitionTo('Cancelled'); }

  private transitionTo(newState: SessionLifecycleState): void {
    if (!canTransitionSession(this.props.state, newState)) {
      throw new InvalidTransitionError(this.props.state, newState);
    }
    this.props.state = newState;
    this.touch();
  }
}
