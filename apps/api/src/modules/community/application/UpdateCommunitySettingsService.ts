import { CommunityRepository } from '../domain/CommunityRepository';
import { Community } from '../domain/Community';
import { CommunityNotFoundError } from '../domain/errors';

export interface UpdateCommunitySettingsInput {
  communityId: string;
  patch: {
    isPublic?: boolean;
    allowMemberInvitations?: boolean;
    invitationExpiryDays?: number;
    defaultMemberRole?: string | null;
  };
}

export class UpdateCommunitySettingsService {
  constructor(private readonly communityRepository: CommunityRepository) {}

  async execute(input: UpdateCommunitySettingsInput): Promise<Community> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError(input.communityId);

    community.updateSettings(input.patch);
    await this.communityRepository.update(community);
    return community;
  }
}
