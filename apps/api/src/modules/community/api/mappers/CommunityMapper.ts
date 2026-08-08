import { Community } from '../../domain/Community';
import { CommunityResponseDto, CommunityListItemDto } from '../dto/CommunityResponseDto';

export class CommunityMapper {
  static toResponseDto(community: Community): CommunityResponseDto {
    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      logoUrl: community.logoUrl,
      ownerId: community.ownerId,
      memberCount: community.activeMembers.length,
      members: community.activeMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        joinedAt: m.joinedAt.toISOString(),
      })),
      positions: community.positions.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        allowsMultipleHolders: p.allowsMultipleHolders,
        currentHolders: p.activeAssignments.map((a) => ({
          memberId: a.memberId,
          assignedAt: a.assignedAt.toISOString(),
        })),
      })),
      settings: {
        isPublic: community.settings.isPublic,
        allowMemberInvitations: community.settings.allowMemberInvitations,
        invitationExpiryDays: community.settings.invitationExpiryDays,
        defaultMemberRole: community.settings.defaultMemberRole,
      },
      createdAt: community.createdAt.toISOString(),
      updatedAt: community.updatedAt.toISOString(),
    };
  }

  static toListItemDto(community: Community): CommunityListItemDto {
    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      logoUrl: community.logoUrl,
      memberCount: community.activeMembers.length,
      createdAt: community.createdAt.toISOString(),
    };
  }
}
