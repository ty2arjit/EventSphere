import { Community } from './Community';

export interface CommunityRepository {
  findById(id: string): Promise<Community | null>;
  findBySlug(slug: string): Promise<Community | null>;
  findByMemberUserId(userId: string): Promise<Community[]>;
  /**
   * Public discovery — every community whose settings.isPublic is true
   * (or has no settings row yet, which defaults to public), optionally
   * filtered by a name/slug substring. Unlike findByMemberUserId, this is
   * not scoped to a caller — it's the "browse all communities" listing.
   */
  search(query: string | null, limit: number, offset: number): Promise<{ communities: Community[]; total: number }>;
  save(community: Community): Promise<void>;
  update(community: Community): Promise<void>;
}
