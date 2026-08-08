import type { RegistrationRepository } from "../domain/RegistrationRepository";
import type { Registration } from "../domain/Registration";

export class InMemoryRegistrationRepository implements RegistrationRepository {
  private registrations: Registration[] = [];

  async findById(id: string): Promise<Registration | null> {
    return this.registrations.find((r) => r.id === id) ?? null;
  }

  async findByEventId(eventId: string): Promise<Registration | null> {
    return this.registrations.find((r) => r.eventId === eventId) ?? null;
  }

  async save(registration: Registration): Promise<void> {
    this.registrations.push(registration);
  }

  async update(registration: Registration): Promise<void> {
    const idx = this.registrations.findIndex((r) => r.id === registration.id);
    if (idx !== -1) this.registrations[idx] = registration;
  }
}
