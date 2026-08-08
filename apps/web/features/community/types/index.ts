export interface CommunityMember {
  id: string;
  userId: string;
  joinedAt: string;
}

export interface CommunityPosition {
  id: string;
  name: string;
  description: string | null;
  allowsMultipleHolders: boolean;
  currentHolders: Array<{ memberId: string; assignedAt: string }>;
}

export interface CommunitySettings {
  isPublic: boolean;
  allowMemberInvitations: boolean;
  invitationExpiryDays: number;
  defaultMemberRole: string | null;
}

export interface CommunityResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
  memberCount: number;
  members: CommunityMember[];
  positions: CommunityPosition[];
  settings: CommunitySettings;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  memberCount: number;
  createdAt: string;
}

export interface CreateCommunityInput {
  name: string;
  slug: string;
  description?: string | null;
}

export interface UpdateCommunityInput {
  name?: string;
  description?: string | null;
  logoUrl?: string | null;
}

export interface CreatePositionInput {
  name: string;
  description?: string | null;
  allowsMultipleHolders?: boolean;
}

export interface CreateInvitationInput {
  email: string;
}

export interface UpdateSettingsInput {
  isPublic?: boolean;
  allowMemberInvitations?: boolean;
  invitationExpiryDays?: number;
  defaultMemberRole?: string | null;
}
