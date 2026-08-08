import { CommunityRepository } from '../domain/CommunityRepository';
import { Community } from '../domain/Community';
import { CommunityNotFoundError } from '../domain/errors';

export class GetCommunityService {
  constructor(private readonly communityRepository: CommunityRepository) {}

  async execute(id: string): Promise<Community> {
    const community = await this.communityRepository.findById(id);
    if (!community) throw new CommunityNotFoundError(id);
    return community;
  }

  async bySlug(slug: string): Promise<Community> {
    const community = await this.communityRepository.findBySlug(slug);
    if (!community) throw new CommunityNotFoundError(slug);
    return community;
  }

  async listByMember(userId: string): Promise<Community[]> {
    return this.communityRepository.findByMemberUserId(userId);
  }
}
