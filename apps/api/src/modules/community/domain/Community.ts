import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/events/DomainEvent';
import { CommunityMember } from './entities/CommunityMember';
import { CommunityPosition } from './entities/CommunityPosition';
import { CommunityInvitation } from './entities/CommunityInvitation';
import { CommunitySettings } from './entities/CommunitySettings';
import {
  MemberAlreadyExistsError,
  MemberNotFoundError,
  CannotRemoveOwnerError,
  PositionNotFoundError,
  PositionAlreadyExistsError,
  NotAMemberError,
  PositionSingleHolderError,
  OwnershipTransferToSelfError,
} from './errors';
import { communityCreated } from './events/CommunityCreated';
import { memberJoined } from './events/MemberJoined';
import { memberRemoved } from './events/MemberRemoved';
import { positionAssigned } from './events/PositionAssigned';
import { positionRemoved } from './events/PositionRemoved';
import { invitationAccepted } from './events/InvitationAccepted';
import { communityOwnershipTransferred } from './events/CommunityOwnershipTransferred';

export interface CommunityProps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
  members: CommunityMember[];
  positions: CommunityPosition[];
  invitations: CommunityInvitation[];
  settings: CommunitySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommunityInput {
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
}

export class Community {
  private readonly pendingEvents: DomainEvent[] = [];

  private constructor(private readonly props: CommunityProps) {}

  static create(input: CreateCommunityInput): Community {
    const id = randomUUID();
    const now = new Date();
    const memberId = randomUUID();

    const community = new Community({
      id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      logoUrl: null,
      ownerId: input.ownerId,
      members: [CommunityMember.create(memberId, input.ownerId, id)],
      positions: [],
      invitations: [],
      settings: CommunitySettings.createDefault(id),
      createdAt: now,
      updatedAt: now,
    });

    community.pendingEvents.push(
      communityCreated({ communityId: id, name: input.name, ownerId: input.ownerId }),
    );
    community.pendingEvents.push(
      memberJoined({ communityId: id, userId: input.ownerId, memberId }),
    );

    return community;
  }

  static fromPersistence(props: CommunityProps): Community {
    return new Community(props);
  }

  pullDomainEvents(): DomainEvent[] {
    return this.pendingEvents.splice(0, this.pendingEvents.length);
  }

  // --- Getters ---
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get description(): string | null { return this.props.description; }
  get logoUrl(): string | null { return this.props.logoUrl; }
  get ownerId(): string { return this.props.ownerId; }
  get members(): readonly CommunityMember[] { return this.props.members; }
  get positions(): readonly CommunityPosition[] { return this.props.positions; }
  get invitations(): readonly CommunityInvitation[] { return this.props.invitations; }
  get settings(): CommunitySettings { return this.props.settings; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get activeMembers(): CommunityMember[] {
    return this.props.members.filter((m) => m.isActive);
  }

  private touch(now: Date = new Date()): void {
    this.props.updatedAt = now;
  }

  // --- Profile ---
  updateProfile(patch: { name?: string; description?: string | null; logoUrl?: string | null }): void {
    if (patch.name !== undefined) this.props.name = patch.name;
    if (patch.description !== undefined) this.props.description = patch.description;
    if (patch.logoUrl !== undefined) this.props.logoUrl = patch.logoUrl;
    this.touch();
  }

  // --- Membership ---
  addMember(userId: string): CommunityMember {
    const existing = this.activeMembers.find((m) => m.userId === userId);
    if (existing) throw new MemberAlreadyExistsError();

    const member = CommunityMember.create(randomUUID(), userId, this.props.id);
    this.props.members.push(member);
    this.touch();

    this.pendingEvents.push(
      memberJoined({ communityId: this.props.id, userId, memberId: member.id }),
    );
    return member;
  }

  removeMember(userId: string): void {
    if (userId === this.props.ownerId) throw new CannotRemoveOwnerError();

    const member = this.activeMembers.find((m) => m.userId === userId);
    if (!member) throw new MemberNotFoundError();

    // Remove from all positions first
    for (const position of this.props.positions) {
      if (position.isHeldBy(member.id)) {
        position.removeAssignment(member.id);
        this.pendingEvents.push(
          positionRemoved({
            communityId: this.props.id,
            positionId: position.id,
            memberId: member.id,
            positionName: position.name,
          }),
        );
      }
    }

    member.leave();
    this.touch();

    this.pendingEvents.push(
      memberRemoved({ communityId: this.props.id, userId, memberId: member.id }),
    );
  }

  findMemberByUserId(userId: string): CommunityMember | undefined {
    return this.activeMembers.find((m) => m.userId === userId);
  }

  // --- Positions ---
  createPosition(name: string, description: string | null, allowsMultipleHolders: boolean): CommunityPosition {
    const existing = this.props.positions.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) throw new PositionAlreadyExistsError(name);

    const position = CommunityPosition.create(randomUUID(), this.props.id, name, description, allowsMultipleHolders);
    this.props.positions.push(position);
    this.touch();
    return position;
  }

  updatePosition(positionId: string, name: string, description: string | null, allowsMultipleHolders: boolean): void {
    const position = this.props.positions.find((p) => p.id === positionId);
    if (!position) throw new PositionNotFoundError();

    const nameConflict = this.props.positions.find(
      (p) => p.id !== positionId && p.name.toLowerCase() === name.toLowerCase(),
    );
    if (nameConflict) throw new PositionAlreadyExistsError(name);

    position.update(name, description, allowsMultipleHolders);
    this.touch();
  }

  assignPosition(positionId: string, memberId: string): void {
    const position = this.props.positions.find((p) => p.id === positionId);
    if (!position) throw new PositionNotFoundError();

    const member = this.activeMembers.find((m) => m.id === memberId);
    if (!member) throw new NotAMemberError();

    if (position.isHeldBy(memberId)) return; // idempotent

    if (!position.allowsMultipleHolders && position.hasActiveHolder()) {
      throw new PositionSingleHolderError();
    }

    position.assign(memberId);
    this.touch();

    this.pendingEvents.push(
      positionAssigned({
        communityId: this.props.id,
        positionId,
        memberId,
        positionName: position.name,
      }),
    );
  }

  removePositionAssignment(positionId: string, memberId: string): void {
    const position = this.props.positions.find((p) => p.id === positionId);
    if (!position) throw new PositionNotFoundError();

    if (!position.isHeldBy(memberId)) return; // idempotent

    position.removeAssignment(memberId);
    this.touch();

    this.pendingEvents.push(
      positionRemoved({
        communityId: this.props.id,
        positionId,
        memberId,
        positionName: position.name,
      }),
    );
  }

  // --- Invitations ---
  createInvitation(invitedEmail: string, invitedByUserId: string): CommunityInvitation {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.props.settings.invitationExpiryDays);

    const invitation = CommunityInvitation.create(
      randomUUID(),
      this.props.id,
      invitedEmail,
      invitedByUserId,
      expiresAt,
    );
    this.props.invitations.push(invitation);
    this.touch();
    return invitation;
  }

  acceptInvitation(invitationId: string, userId: string): CommunityMember {
    const invitation = this.props.invitations.find((i) => i.id === invitationId);
    if (!invitation) throw new Error('Invitation not found');

    invitation.accept();
    const member = this.addMember(userId);

    this.pendingEvents.push(
      invitationAccepted({ communityId: this.props.id, invitationId, userId }),
    );
    return member;
  }

  // --- Ownership ---
  transferOwnership(newOwnerId: string): void {
    if (newOwnerId === this.props.ownerId) throw new OwnershipTransferToSelfError();

    const member = this.activeMembers.find((m) => m.userId === newOwnerId);
    if (!member) throw new NotAMemberError();

    const fromUserId = this.props.ownerId;
    this.props.ownerId = newOwnerId;
    this.touch();

    this.pendingEvents.push(
      communityOwnershipTransferred({
        communityId: this.props.id,
        fromUserId,
        toUserId: newOwnerId,
      }),
    );
  }

  // --- Settings ---
  updateSettings(patch: {
    isPublic?: boolean;
    allowMemberInvitations?: boolean;
    invitationExpiryDays?: number;
    defaultMemberRole?: string | null;
  }): void {
    this.props.settings.update(patch);
    this.touch();
  }
}
