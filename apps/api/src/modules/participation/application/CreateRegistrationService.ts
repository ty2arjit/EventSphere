import type { RegistrationRepository } from "../domain/RegistrationRepository";
import type { EventPublisher } from "../../../shared/events/EventPublisher";
import { Registration } from "../domain/Registration";
import { RegistrationAlreadyExistsError } from "../domain/errors";
import { registrationCreated } from "../domain/events/ParticipationEvents";
import type { ApprovalStrategy } from "../domain/valueObjects/ApprovalStrategy";

export class CreateRegistrationService {
  constructor(
    private readonly repo: RegistrationRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(eventId: string, approvalStrategy: ApprovalStrategy = "Automatic"): Promise<Registration> {
    const existing = await this.repo.findByEventId(eventId);
    if (existing) throw new RegistrationAlreadyExistsError(eventId);

    const registration = Registration.create(eventId, approvalStrategy);
    await this.repo.save(registration);
    await this.publisher.publish(registrationCreated(registration.id, eventId));
    return registration;
  }
}
