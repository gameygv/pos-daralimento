import { describe, it, expect } from 'vitest';
import { optionGroupFormSchema, optionValueFormSchema, variantUpdateSchema } from '../variant.schema';

describe('optionGroupFormSchema', () => {
  it('accepts valid input', () => {
    const result = optionGroupFormSchema.safeParse({ name: 'Tamano', sort_order: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = optionGroupFormSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre es requerido');
    }
  });

  it('defaults sort_order to 0', () => {
    const result = optionGroupFormSchema.safeParse({ name: 'Color' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(0);
    }
  });

  it('rejects name longer than 100 chars', () => {
    const result = optionGroupFormSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('optionValueFormSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid input', () => {
    const result = optionValueFormSchema.safeParse({
      group_id: validUUID,
      value: 'Rojo',
      sort_order: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty value', () => {
    const result = optionValueFormSchema.safeParse({
      group_id: validUUID,
      value: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El valor es requerido');
    }
  });

  it('rejects invalid group_id', () => {
    const result = optionValueFormSchema.safeParse({
      group_id: 'not-a-uuid',
      value: 'Rojo',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ID de grupo inválido');
    }
  });

  it('defaults sort_order to 0', () => {
    const result = optionValueFormSchema.safeParse({
      group_id: validUUID,
      value: 'Azul',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(0);
    }
  });
});

describe('variantUpdateSchema', () => {
  it('accepts valid input', () => {
    const result = variantUpdateSchema.safeParse({
      sku: 'CNC-001-ROJ-M',
      price_override: 400,
      stock: 10,
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty SKU', () => {
    const result = variantUpdateSchema.safeParse({
      sku: '',
      stock: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El SKU es requerido');
    }
  });

  it('accepts null price_override', () => {
    const result = variantUpdateSchema.safeParse({
      sku: 'CNC-001',
      price_override: null,
      stock: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price_override).toBeNull();
    }
  });

  it('rejects negative stock', () => {
    const result = variantUpdateSchema.safeParse({
      sku: 'CNC-001',
      stock: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative price_override', () => {
    const result = variantUpdateSchema.safeParse({
      sku: 'CNC-001',
      price_override: -50,
      stock: 0,
    });
    expect(result.success).toBe(false);
  });

  it('coerces string stock to number', () => {
    const result = variantUpdateSchema.safeParse({
      sku: 'CNC-001',
      stock: '15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toBe(15);
    }
  });

  it('defaults is_active to true', () => {
    const result = variantUpdateSchema.safeParse({
      sku: 'CNC-001',
      stock: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
    }
  });
});
