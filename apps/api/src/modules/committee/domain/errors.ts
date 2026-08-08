export class CommitteeNotFoundError extends Error {
  constructor(id: string) {
    super(`Committee not found: ${id}`);
    this.name = "CommitteeNotFoundError";
  }
}

export class CommitteeAlreadyExistsError extends Error {
  constructor(eventId: string) {
    super(`A committee already exists for event: ${eventId}`);
    this.name = "CommitteeAlreadyExistsError";
  }
}
