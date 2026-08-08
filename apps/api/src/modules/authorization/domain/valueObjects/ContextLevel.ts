export type ContextLevel = 'Platform' | 'Community' | 'Event';

const VALID_LEVELS: ContextLevel[] = ['Platform', 'Community', 'Event'];

export function validateContextLevel(value: string): ContextLevel {
  if (!VALID_LEVELS.includes(value as ContextLevel)) {
    throw new Error(`Invalid context level: ${value}. Must be one of: ${VALID_LEVELS.join(', ')}`);
  }
  return value as ContextLevel;
}
