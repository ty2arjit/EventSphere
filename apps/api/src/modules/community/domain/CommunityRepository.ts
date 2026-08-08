import { Community } from './Community';

export interface CommunityRepository {
  findById(id: string): Promise<Community | null>;
  findBySlug(slug: string): Promise<Community | null>;
  findByMemberUserId(userId: string): Promise<Community[]>;
  save(community: Community): Promise<void>;
  update(community: Community): Promise<void>;
}
