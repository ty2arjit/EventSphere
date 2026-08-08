export interface CommunityMemberDto {
  id: string;
  userId: string;
  joinedAt: string;
}

export interface CommunityPositionDto {
  id: string;
  name: string;
  description: string | null;
  allowsMultipleHolders: boolean;
  currentHolders: Array<{ memberId: string; assignedAt: string }>;
}

export interface CommunitySettingsDto {
  isPublic: boolean;
  allowMemberInvitations: boolean;
  invitationExpiryDays: number;
  defaultMemberRole: string | null;
}

export interface CommunityResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
  memberCount: number;
  members: CommunityMemberDto[];
  positions: CommunityPositionDto[];
  settings: CommunitySettingsDto;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityListItemDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  memberCount: number;
  createdAt: string;
}
