import { EventRepository } from '../domain/EventRepository';
import { EventNotFoundError } from '../domain/errors';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { EventMode } from '../domain/valueObjects/EventMode';
import { EventVisibility } from '../domain/valueObjects/EventVisibility';
import { Location } from '../domain/valueObjects/Location';
import { Capacity } from '../domain/valueObjects/Capacity';

export interface UpdateEventInput {
  id: string;
  name?: string;
  description?: string | null;
  bannerUrl?: string | null;
  category?: string | null;
  tags?: string[];
  mode?: EventMode;
  visibility?: EventVisibility;
  location?: Location;
  capacity?: Capacity;
  startDate?: Date;
  endDate?: Date;
  settings?: {
    requireApproval?: boolean;
    allowWaitlist?: boolean;
    showAttendeeList?: boolean;
    allowGuestRegistration?: boolean;
  };
}

export class UpdateEventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: UpdateEventInput): Promise<void> {
    const event = await this.repository.findById(input.id);
    if (!event) throw new EventNotFoundError(input.id);

    const { id: _, location, capacity, startDate, endDate, settings, ...profileFields } = input;
    const hasProfileUpdates = Object.keys(profileFields).length > 0;
    if (hasProfileUpdates) event.updateProfile(profileFields);
    if (location) event.updateLocation(location);
    if (capacity) event.updateCapacity(capacity);
    if (startDate && endDate) event.updateDates(startDate, endDate);
    if (settings) event.updateSettings(settings);

    await this.repository.update(event);
    for (const domainEvent of event.pullDomainEvents()) {
      await this.eventPublisher.publish(domainEvent);
    }
  }
}
