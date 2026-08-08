import type { Registration } from "./Registration";

export interface RegistrationRepository {
  findById(id: string): Promise<Registration | null>;
  findByEventId(eventId: string): Promise<Registration | null>;
  save(registration: Registration): Promise<void>;
  update(registration: Registration): Promise<void>;
}
