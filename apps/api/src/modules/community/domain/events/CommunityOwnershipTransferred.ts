import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const COMMUNITY_OWNERSHIP_TRANSFERRED = 'CommunityOwnershipTransferred';

export interface CommunityOwnershipTransferredPayload {
  communityId: string;
  fromUserId: string;
  toUserId: string;
}

export function communityOwnershipTransferred(
  payload: CommunityOwnershipTransferredPayload,
): DomainEvent<CommunityOwnershipTransferredPayload> {
  return createDomainEvent({
    eventType: COMMUNITY_OWNERSHIP_TRANSFERRED,
    aggregateId: payload.communityId,
    aggregateType: 'Community',
    payload,
  });
}
