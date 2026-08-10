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

  async browse(
    query: string | null,
    page: number,
    pageSize: number,
  ): Promise<{ communities: Community[]; total: number }> {
    const limit = Math.min(Math.max(pageSize, 1), 50);
    const offset = Math.max(page, 0) * limit;
    return this.communityRepository.search(query, limit, offset);
  }
}
