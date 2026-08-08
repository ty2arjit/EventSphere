export interface CommunityMemberProps {
  id: string;
  userId: string;
  communityId: string;
  joinedAt: Date;
  leftAt: Date | null;
}

export class CommunityMember {
  constructor(private readonly props: CommunityMemberProps) {}

  static create(id: string, userId: string, communityId: string): CommunityMember {
    return new CommunityMember({
      id,
      userId,
      communityId,
      joinedAt: new Date(),
      leftAt: null,
    });
  }

  static fromPersistence(props: CommunityMemberProps): CommunityMember {
    return new CommunityMember(props);
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get communityId(): string { return this.props.communityId; }
  get joinedAt(): Date { return this.props.joinedAt; }
  get leftAt(): Date | null { return this.props.leftAt; }
  get isActive(): boolean { return this.props.leftAt === null; }

  leave(now: Date = new Date()): void {
    this.props.leftAt = now;
  }
}
