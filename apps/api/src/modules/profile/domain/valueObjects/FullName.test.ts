import { describe, expect, it } from 'vitest';
import { FullName } from './FullName';
import { InvalidNameError } from '../errors';

describe('FullName.create', () => {
  it('trims valid input', () => {
    expect(FullName.create('  Jane Doe  ').value).toBe('Jane Doe');
  });

  it('rejects empty input', () => {
    expect(() => FullName.create('   ')).toThrow(InvalidNameError);
  });
});
