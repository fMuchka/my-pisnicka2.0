import { describe, expect, it } from 'vitest';
import { isEmail, validatePassword, validateUser } from '../validation';

describe('validateUser', () => {
  it('rejects empty and whitespace-only values', () => {
    expect(validateUser('')).toBe(false);
    expect(validateUser('   ')).toBe(false);
  });

  it('accepts a plain user name', () => {
    expect(validateUser('tom')).toBe(true);
    expect(validateUser('Tom Bombadil')).toBe(true);
  });

  it('validates values containing @ as e-mail addresses', () => {
    expect(validateUser('tom@example.com')).toBe(true);
    expect(validateUser('tom@example')).toBe(false);
  });

  it('trims surrounding whitespace before validating', () => {
    expect(validateUser('  tom@example.com  ')).toBe(true);
  });
});

describe('isEmail', () => {
  it.each(['tom@example.com', 'tom.bombadil@old.forest.me', 'a@b.c', 'tom@example.com.'])(
    'accepts %s',
    (value) => {
      expect(isEmail(value)).toBe(true);
    }
  );

  it.each([
    ['missing local part', '@example.com'],
    ['missing domain', 'tom@'],
    ['domain without a dot', 'tom@example'],
    ['dot right after @', 'tom@.com'],
    ['dot only at the end', 'tom@example.'],
    ['two @ signs', 'tom@old@forest.me'],
    ['whitespace inside', 'tom bombadil@example.com'],
    ['no @ at all', 'example.com'],
  ])('rejects %s', (_, value) => {
    expect(isEmail(value)).toBe(false);
  });
});

describe('validatePassword', () => {
  it('rejects an empty password', () => {
    expect(validatePassword('')).toBe(false);
  });

  it('accepts any non-empty password, whitespace included', () => {
    expect(validatePassword('secret')).toBe(true);
    expect(validatePassword(' ')).toBe(true);
  });
});
