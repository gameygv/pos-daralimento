import { describe, it, expect } from 'vitest';
import { slugify } from '../slugify';

describe('slugify', () => {
  it('lowercases input', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips accents (NFD normalization)', () => {
    expect(slugify('café')).toBe('cafe');
    expect(slugify('cerámica')).toBe('ceramica');
    expect(slugify('categorías')).toBe('categorias');
  });

  it('replaces non-alphanumeric characters with hyphens', () => {
    expect(slugify('bowls & cups')).toBe('bowls-cups');
    expect(slugify('hello...world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
    expect(slugify('  hello  ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles string with only special characters', () => {
    expect(slugify('---')).toBe('');
    expect(slugify('!!!')).toBe('');
  });

  it('preserves numbers', () => {
    expect(slugify('Cuenco 20cm')).toBe('cuenco-20cm');
  });
});
