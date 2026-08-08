import { randomUUID } from 'node:crypto';

export interface PositionAssignment {
  id: string;
  memberId: string;
  assignedAt: Date;
  removedAt: Date | null;
}

export interface CommunityPositionProps {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  allowsMultipleHolders: boolean;
  assignments: PositionAssignment[];
  createdAt: Date;
}

export class CommunityPosition {
  constructor(private readonly props: CommunityPositionProps) {}

  static create(
    id: string,
    communityId: string,
    name: string,
    description: string | null,
    allowsMultipleHolders: boolean,
  ): CommunityPosition {
    return new CommunityPosition({
      id,
      communityId,
      name,
      description,
      allowsMultipleHolders,
      assignments: [],
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: CommunityPositionProps): CommunityPosition {
    return new CommunityPosition(props);
  }

  get id(): string { return this.props.id; }
  get communityId(): string { return this.props.communityId; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get allowsMultipleHolders(): boolean { return this.props.allowsMultipleHolders; }
  get assignments(): readonly PositionAssignment[] { return this.props.assignments; }
  get createdAt(): Date { return this.props.createdAt; }

  get activeAssignments(): PositionAssignment[] {
    return this.props.assignments.filter((a) => a.removedAt === null);
  }

  hasActiveHolder(): boolean {
    return this.activeAssignments.length > 0;
  }

  isHeldBy(memberId: string): boolean {
    return this.activeAssignments.some((a) => a.memberId === memberId);
  }

  assign(memberId: string, now: Date = new Date()): void {
    this.props.assignments.push({ id: randomUUID(), memberId, assignedAt: now, removedAt: null });
  }

  removeAssignment(memberId: string, now: Date = new Date()): void {
    const assignment = this.activeAssignments.find((a) => a.memberId === memberId);
    if (assignment) {
      assignment.removedAt = now;
    }
  }

  update(name: string, description: string | null, allowsMultipleHolders: boolean): void {
    this.props.name = name;
    this.props.description = description;
    this.props.allowsMultipleHolders = allowsMultipleHolders;
  }
}
