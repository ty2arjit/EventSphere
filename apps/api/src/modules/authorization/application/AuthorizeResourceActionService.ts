import { PermissionPolicyRepository } from '../domain/PermissionPolicyRepository';
import { CommunityRepository } from '../../community/domain/CommunityRepository';
import { EventCommitteeRepository } from '../../committee/domain/EventCommitteeRepository';
import { ContextLevel } from '../domain/valueObjects/ContextLevel';
import { ResponsibilityReference, createResponsibilityReference } from '../domain/valueObjects/ResponsibilityReference';

export interface AuthorizeActionInput {
  userId: string;
  permissionName: string;
  communityId: string;
  eventId?: string | null;
}

/**
 * Cross-context authorization decision, combining two layers:
 *
 * 1. Fast path — a Community's owner can always act within their own
 *    community. There is no separate "Owner" CommunityPosition/PermissionGrant
 *    seeded for this; ownership is the community's own invariant (Ch.18).
 * 2. Formal grants — otherwise, the caller's active CommunityPosition and (if
 *    an eventId is given) CommitteeRole assignments are resolved into
 *    ResponsibilityReferences and evaluated against PermissionPolicy at
 *    Event, then Community, then Platform context. Deny is default.
 */
export class AuthorizeResourceActionService {
  constructor(
    private readonly policyRepository: PermissionPolicyRepository,
    private readonly communityRepository: CommunityRepository,
    private readonly committeeRepository?: EventCommitteeRepository,
  ) {}

  async isAllowed(input: AuthorizeActionInput): Promise<boolean> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) return false;

    if (community.ownerId === input.userId) return true;

    const refs: ResponsibilityReference[] = [];

    const member = community.findMemberByUserId(input.userId);
    if (member) {
      for (const position of community.positions) {
        if (position.isHeldBy(member.id)) {
          refs.push(createResponsibilityReference('CommunityPosition', position.id));
        }
      }
    }

    if (input.eventId && this.committeeRepository) {
      const committee = await this.committeeRepository.findByEventId(input.eventId);
      if (committee) {
        for (const role of committee.getUserRoles(input.userId)) {
          refs.push(createResponsibilityReference('CommitteeRole', role.id));
        }
      }
    }

    if (refs.length === 0) return false;

    const policy = await this.policyRepository.load();

    const contextsToTry: Array<{ level: ContextLevel; id: string | null }> = [];
    if (input.eventId) contextsToTry.push({ level: 'Event', id: input.eventId });
    contextsToTry.push({ level: 'Community', id: input.communityId });
    contextsToTry.push({ level: 'Platform', id: null });

    for (const ctx of contextsToTry) {
      if (policy.evaluate(input.permissionName, ctx.level, ctx.id, refs) === 'Allow') {
        return true;
      }
    }

    return false;
  }
}
