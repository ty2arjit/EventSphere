import { User } from '../domain/User';
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
    };
  }
}
