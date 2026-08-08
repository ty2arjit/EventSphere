export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface CommunityInvitationProps {
  id: string;
  communityId: string;
  invitedEmail: string;
  invitedByUserId: string;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  respondedAt: Date | null;
}

export class CommunityInvitation {
  constructor(private readonly props: CommunityInvitationProps) {}

  static create(
    id: string,
    communityId: string,
    invitedEmail: string,
    invitedByUserId: string,
    expiresAt: Date,
  ): CommunityInvitation {
    return new CommunityInvitation({
      id,
      communityId,
      invitedEmail,
      invitedByUserId,
      status: 'pending',
      createdAt: new Date(),
      expiresAt,
      respondedAt: null,
    });
  }

  static fromPersistence(props: CommunityInvitationProps): CommunityInvitation {
    return new CommunityInvitation(props);
  }

  get id(): string { return this.props.id; }
  get communityId(): string { return this.props.communityId; }
  get invitedEmail(): string { return this.props.invitedEmail; }
  get invitedByUserId(): string { return this.props.invitedByUserId; }
  get status(): InvitationStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get expiresAt(): Date { return this.props.expiresAt; }
  get respondedAt(): Date | null { return this.props.respondedAt; }

  isExpired(now: Date = new Date()): boolean {
    return now > this.props.expiresAt;
  }

  accept(now: Date = new Date()): void {
    if (this.isExpired(now)) {
      this.props.status = 'expired';
      throw new Error('Invitation has expired');
    }
    if (this.props.status !== 'pending') {
      throw new Error('Invitation is not pending');
    }
    this.props.status = 'accepted';
    this.props.respondedAt = now;
  }

  decline(now: Date = new Date()): void {
    if (this.props.status !== 'pending') {
      throw new Error('Invitation is not pending');
    }
    this.props.status = 'declined';
    this.props.respondedAt = now;
  }
}
