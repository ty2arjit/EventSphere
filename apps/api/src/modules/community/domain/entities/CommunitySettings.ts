export interface CommunitySettingsProps {
  communityId: string;
  isPublic: boolean;
  allowMemberInvitations: boolean;
  invitationExpiryDays: number;
  defaultMemberRole: string | null;
}

export class CommunitySettings {
  constructor(private readonly props: CommunitySettingsProps) {}

  static createDefault(communityId: string): CommunitySettings {
    return new CommunitySettings({
      communityId,
      isPublic: true,
      allowMemberInvitations: false,
      invitationExpiryDays: 7,
      defaultMemberRole: null,
    });
  }

  static fromPersistence(props: CommunitySettingsProps): CommunitySettings {
    return new CommunitySettings(props);
  }

  get communityId(): string { return this.props.communityId; }
  get isPublic(): boolean { return this.props.isPublic; }
  get allowMemberInvitations(): boolean { return this.props.allowMemberInvitations; }
  get invitationExpiryDays(): number { return this.props.invitationExpiryDays; }
  get defaultMemberRole(): string | null { return this.props.defaultMemberRole; }

  update(patch: Partial<Omit<CommunitySettingsProps, 'communityId'>>): void {
    if (patch.isPublic !== undefined) this.props.isPublic = patch.isPublic;
    if (patch.allowMemberInvitations !== undefined) this.props.allowMemberInvitations = patch.allowMemberInvitations;
    if (patch.invitationExpiryDays !== undefined) this.props.invitationExpiryDays = patch.invitationExpiryDays;
    if (patch.defaultMemberRole !== undefined) this.props.defaultMemberRole = patch.defaultMemberRole;
  }
}
