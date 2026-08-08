import { Community } from '../domain/Community';
import { CommunityRepository } from '../domain/CommunityRepository';

export class InMemoryCommunityRepository implements CommunityRepository {
  private readonly store = new Map<string, Community>();

  async findById(id: string): Promise<Community | null> {
    return this.store.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Community | null> {
    for (const community of this.store.values()) {
      if (community.slug === slug) return community;
    }
    return null;
  }

  async findByMemberUserId(userId: string): Promise<Community[]> {
    const result: Community[] = [];
    for (const community of this.store.values()) {
      if (community.activeMembers.some((m) => m.userId === userId)) {
        result.push(community);
      }
    }
    return result;
  }

  async save(community: Community): Promise<void> {
    this.store.set(community.id, community);
  }

  async update(community: Community): Promise<void> {
    this.store.set(community.id, community);
  }
}
