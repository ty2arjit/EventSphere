import type {
  PrismaClient,
  Community as CommunityRecord,
  CommunityMember as MemberRecord,
  CommunityPosition as PositionRecord,
  PositionAssignment as AssignmentRecord,
  CommunityInvitation as InvitationRecord,
  CommunitySettings as SettingsRecord,
} from '@prisma/client';
import { Community } from '../domain/Community';
import { CommunityRepository } from '../domain/CommunityRepository';
import { CommunityMember } from '../domain/entities/CommunityMember';
import { CommunityPosition, PositionAssignment } from '../domain/entities/CommunityPosition';
import { CommunityInvitation, InvitationStatus } from '../domain/entities/CommunityInvitation';
import { CommunitySettings } from '../domain/entities/CommunitySettings';

type Loaded = CommunityRecord & {
  members: MemberRecord[];
  positions: (PositionRecord & { assignments: AssignmentRecord[] })[];
  invitations: InvitationRecord[];
  settings: SettingsRecord | null;
};

const INCLUDE = {
  members: true,
  positions: { include: { assignments: true } },
  invitations: true,
  settings: true,
} as const;

function toDomain(record: Loaded): Community {
  return Community.fromPersistence({
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    logoUrl: record.logoUrl,
    ownerId: record.ownerId,
    members: record.members.map((m) =>
      CommunityMember.fromPersistence({
        id: m.id,
        userId: m.userId,
        communityId: m.communityId,
        joinedAt: m.joinedAt,
        leftAt: m.leftAt,
      }),
    ),
    positions: record.positions.map((p) =>
      CommunityPosition.fromPersistence({
        id: p.id,
        communityId: p.communityId,
        name: p.name,
        description: p.description,
        allowsMultipleHolders: p.allowsMultipleHolders,
        assignments: p.assignments.map((a) => ({
          id: a.id,
          memberId: a.memberId,
          assignedAt: a.assignedAt,
          removedAt: a.removedAt,
        })),
        createdAt: p.createdAt,
      }),
    ),
    invitations: record.invitations.map((i) =>
      CommunityInvitation.fromPersistence({
        id: i.id,
        communityId: i.communityId,
        invitedEmail: i.invitedEmail,
        invitedByUserId: i.invitedByUserId,
        status: i.status as InvitationStatus,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
        respondedAt: i.respondedAt,
      }),
    ),
    settings: record.settings
      ? CommunitySettings.fromPersistence({
          communityId: record.settings.communityId,
          isPublic: record.settings.isPublic,
          allowMemberInvitations: record.settings.allowMemberInvitations,
          invitationExpiryDays: record.settings.invitationExpiryDays,
          defaultMemberRole: record.settings.defaultMemberRole,
        })
      : CommunitySettings.createDefault(record.id),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export class PrismaCommunityRepository implements CommunityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Community | null> {
    const record = await this.prisma.community.findUnique({
      where: { id },
      include: INCLUDE,
    });
    return record ? toDomain(record as Loaded) : null;
  }

  async findBySlug(slug: string): Promise<Community | null> {
    const record = await this.prisma.community.findUnique({
      where: { slug },
      include: INCLUDE,
    });
    return record ? toDomain(record as Loaded) : null;
  }

  async findByMemberUserId(userId: string): Promise<Community[]> {
    const records = await this.prisma.community.findMany({
      where: {
        members: { some: { userId, leftAt: null } },
      },
      include: INCLUDE,
    });
    return records.map((r) => toDomain(r as Loaded));
  }

  async search(
    query: string | null,
    limit: number,
    offset: number,
  ): Promise<{ communities: Community[]; total: number }> {
    const where = {
      OR: [{ settings: null }, { settings: { isPublic: true } }],
      ...(query
        ? {
            AND: [
              {
                OR: [
                  { name: { contains: query, mode: 'insensitive' as const } },
                  { slug: { contains: query, mode: 'insensitive' as const } },
                ],
              },
            ],
          }
        : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.community.count({ where }),
    ]);

    return { communities: records.map((r) => toDomain(r as Loaded)), total };
  }

  async save(community: Community): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.community.create({
        data: {
          id: community.id,
          name: community.name,
          slug: community.slug,
          description: community.description,
          logoUrl: community.logoUrl,
          ownerId: community.ownerId,
          members: {
            create: community.members.map((m) => ({
              id: m.id,
              userId: m.userId,
              joinedAt: m.joinedAt,
              leftAt: m.leftAt,
            })),
          },
          settings: {
            create: {
              isPublic: community.settings.isPublic,
              allowMemberInvitations: community.settings.allowMemberInvitations,
              invitationExpiryDays: community.settings.invitationExpiryDays,
              defaultMemberRole: community.settings.defaultMemberRole,
            },
          },
        },
      });
    });
  }

  async update(community: Community): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.community.update({
        where: { id: community.id },
        data: {
          name: community.name,
          slug: community.slug,
          description: community.description,
          logoUrl: community.logoUrl,
          ownerId: community.ownerId,
          updatedAt: community.updatedAt,
        },
      });

      // Upsert members
      for (const member of community.members) {
        await tx.communityMember.upsert({
          where: { id: member.id },
          create: {
            id: member.id,
            communityId: community.id,
            userId: member.userId,
            joinedAt: member.joinedAt,
            leftAt: member.leftAt,
          },
          update: { leftAt: member.leftAt },
        });
      }

      // Upsert positions and assignments
      for (const position of community.positions) {
        await tx.communityPosition.upsert({
          where: { id: position.id },
          create: {
            id: position.id,
            communityId: community.id,
            name: position.name,
            description: position.description,
            allowsMultipleHolders: position.allowsMultipleHolders,
            createdAt: position.createdAt,
          },
          update: {
            name: position.name,
            description: position.description,
            allowsMultipleHolders: position.allowsMultipleHolders,
          },
        });

        for (const assignment of position.assignments) {
          await tx.positionAssignment.upsert({
            where: { id: assignment.id },
            create: {
              id: assignment.id,
              positionId: position.id,
              memberId: assignment.memberId,
              assignedAt: assignment.assignedAt,
              removedAt: assignment.removedAt,
            },
            update: { removedAt: assignment.removedAt },
          });
        }
      }

      // Upsert invitations
      for (const invitation of community.invitations) {
        await tx.communityInvitation.upsert({
          where: { id: invitation.id },
          create: {
            id: invitation.id,
            communityId: community.id,
            invitedEmail: invitation.invitedEmail,
            invitedByUserId: invitation.invitedByUserId,
            status: invitation.status,
            createdAt: invitation.createdAt,
            expiresAt: invitation.expiresAt,
            respondedAt: invitation.respondedAt,
          },
          update: {
            status: invitation.status,
            respondedAt: invitation.respondedAt,
          },
        });
      }

      // Update settings
      await tx.communitySettings.upsert({
        where: { communityId: community.id },
        create: {
          communityId: community.id,
          isPublic: community.settings.isPublic,
          allowMemberInvitations: community.settings.allowMemberInvitations,
          invitationExpiryDays: community.settings.invitationExpiryDays,
          defaultMemberRole: community.settings.defaultMemberRole,
        },
        update: {
          isPublic: community.settings.isPublic,
          allowMemberInvitations: community.settings.allowMemberInvitations,
          invitationExpiryDays: community.settings.invitationExpiryDays,
          defaultMemberRole: community.settings.defaultMemberRole,
        },
      });
    });
  }
}
