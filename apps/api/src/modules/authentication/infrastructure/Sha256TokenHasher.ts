import { createHash } from 'node:crypto';
import { TokenHasher } from '../domain/services/TokenHasher';

export class Sha256TokenHasher implements TokenHasher {
  hash(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
