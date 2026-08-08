import type { RegistrationRepository } from "../domain/RegistrationRepository";
import type { EventPublisher } from "../../../shared/events/EventPublisher";
import { RegistrationNotFoundError } from "../domain/errors";
import { registrationOpened, registrationClosed } from "../domain/events/ParticipationEvents";
import type { ApprovalStrategy } from "../domain/valueObjects/ApprovalStrategy";
import type { RegistrationWindow } from "../domain/valueObjects/RegistrationWindow";
import type { CapacityPolicy } from "../domain/valueObjects/CapacityPolicy";
import type { Registration } from "../domain/Registration";

export class ManageRegistrationService {
  constructor(
    private readonly repo: RegistrationRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async getByEventId(eventId: string): Promise<Registration | null> {
    return this.repo.findByEventId(eventId);
  }

  async open(registrationId: string): Promise<void> {
    const reg = await this.load(registrationId);
    reg.open();
    await this.repo.update(reg);
    await this.publisher.publish(registrationOpened(reg.id, reg.eventId));
  }

  async close(registrationId: string): Promise<void> {
    const reg = await this.load(registrationId);
    reg.close();
    await this.repo.update(reg);
    await this.publisher.publish(registrationClosed(reg.id, reg.eventId));
  }

  async updateConfig(
    registrationId: string,
    config: {
      approvalStrategy?: ApprovalStrategy;
      window?: RegistrationWindow;
      capacity?: CapacityPolicy;
    },
  ): Promise<void> {
    const reg = await this.load(registrationId);
    if (config.approvalStrategy) reg.updateConfig({ approvalStrategy: config.approvalStrategy });
    if (config.window) reg.setWindow(config.window);
    if (config.capacity) reg.setCapacity(config.capacity);
    await this.repo.update(reg);
  }

  async addQuestion(
    registrationId: string,
    label: string,
    type: "Text" | "Number" | "Select" | "MultiSelect" | "File" | "Date",
    required: boolean = false,
    options: string[] = [],
  ) {
    const reg = await this.load(registrationId);
    const question = reg.addQuestion(label, type, required, options);
    await this.repo.update(reg);
    return question;
  }

  async removeQuestion(registrationId: string, questionId: string): Promise<void> {
    const reg = await this.load(registrationId);
    reg.removeQuestion(questionId);
    await this.repo.update(reg);
  }

  private async load(id: string) {
    const reg = await this.repo.findById(id);
    if (!reg) throw new RegistrationNotFoundError(id);
    return reg;
  }
}
