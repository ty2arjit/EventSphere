import { User } from '../../domain/User';
import { ProfileResponseDto } from '../dto/ProfileResponseDto';

/**
 * The only place a domain User is converted to a transportable shape.
 * The domain object itself is never returned from a controller
 * (Constitution Articles 21, 22).
 */
export class ProfileMapper {
  static toResponseDto(user: User): ProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      status: user.status,
      verifiedAt: user.verifiedAt ? user.verifiedAt.toISOString() : null,
      profile: {
        avatarUrl: user.profile.avatar.url,
        bio: user.profile.bio,
        headline: user.profile.headline,
        institution: user.profile.institution,
        department: user.profile.department,
        graduationYear: user.profile.graduationYear,
      },
      preferences: {
        language: user.preferences.language,
        timezone: user.preferences.timezone,
        theme: user.preferences.theme,
        notifyByEmail: user.preferences.notifyByEmail,
        notifyInApp: user.preferences.notifyInApp,
      },
    };
  }
}
