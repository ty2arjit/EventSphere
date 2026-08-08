import { DomainError, DomainErrorKind } from '../../../shared/errors/DomainError';

export class CommunityNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'COMMUNITY_NOT_FOUND';
  constructor(id: string) {
    super(`Community not found: ${id}`);
  }
}

export class MemberAlreadyExistsError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'MEMBER_ALREADY_EXISTS';
  constructor() {
    super('User is already a member of this community');
  }
}

export class MemberNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'MEMBER_NOT_FOUND';
  constructor() {
    super('Member not found in this community');
  }
}

export class CannotRemoveOwnerError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'CANNOT_REMOVE_OWNER';
  constructor() {
    super('Cannot remove the community owner. Transfer ownership first.');
  }
}

export class PositionNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'POSITION_NOT_FOUND';
  constructor() {
    super('Position not found in this community');
  }
}

export class PositionAlreadyExistsError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'POSITION_ALREADY_EXISTS';
  constructor(name: string) {
    super(`Position already exists: ${name}`);
  }
}

export class NotAMemberError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'NOT_A_MEMBER';
  constructor() {
    super('Only community members can hold positions');
  }
}

export class PositionSingleHolderError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'POSITION_SINGLE_HOLDER';
  constructor() {
    super('This position does not allow multiple holders');
  }
}

export class InvitationNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'INVITATION_NOT_FOUND';
  constructor() {
    super('Invitation not found');
  }
}

export class InvitationExpiredError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVITATION_EXPIRED';
  constructor() {
    super('This invitation has expired');
  }
}

export class InvitationAlreadyUsedError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'INVITATION_ALREADY_USED';
  constructor() {
    super('This invitation has already been used');
  }
}

export class OwnershipTransferToSelfError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'OWNERSHIP_TRANSFER_TO_SELF';
  constructor() {
    super('Cannot transfer ownership to yourself');
  }
}

export class CommunitySlugTakenError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'COMMUNITY_SLUG_TAKEN';
  constructor(slug: string) {
    super(`Community slug already taken: ${slug}`);
  }
}
