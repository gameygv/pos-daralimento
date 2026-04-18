import { describe, it, expect } from 'vitest';
import { categoryFormSchema } from '../category.schema';

describe('categoryFormSchema', () => {
  const validInput = {
    name: 'Cuencos',
    slug: 'cuencos',
    description: null,
    parent_id: null,
    sort_order: 0,
    is_active: true,
  };

  it('accepts valid input', () => {
    const result = categoryFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = categoryFormSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre es requerido');
    }
  });

  it('rejects invalid slug format', () => {
    const result = categoryFormSchema.safeParse({ ...validInput, slug: 'INVALID SLUG!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Solo letras');
    }
  });

  it('accepts valid slug with hyphens and numbers', () => {
    const result = categoryFormSchema.safeParse({ ...validInput, slug: 'bowls-20cm' });
    expect(result.success).toBe(true);
  });

  it('coerces sort_order to number', () => {
    const result = categoryFormSchema.safeParse({ ...validInput, sort_order: '5' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(5);
    }
  });

  it('rejects negative sort_order', () => {
    const result = categoryFormSchema.safeParse({ ...validInput, sort_order: -1 });
    expect(result.success).toBe(false);
  });

  it('defaults is_active to true', () => {
    const { is_active: _, ...withoutActive } = validInput;
    const result = categoryFormSchema.safeParse(withoutActive);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
    }
  });

  it('defaults description to null', () => {
    const { description: _, ...withoutDesc } = validInput;
    const result = categoryFormSchema.safeParse(withoutDesc);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });

  it('rejects description over 500 characters', () => {
    const result = categoryFormSchema.safeParse({ ...validInput, description: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('validates parent_id as UUID when provided', () => {
    const result = categoryFormSchema.safeParse({ ...validInput, parent_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('accepts valid UUID for parent_id', () => {
    const result = categoryFormSchema.safeParse({
      ...validInput,
      parent_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });
});
