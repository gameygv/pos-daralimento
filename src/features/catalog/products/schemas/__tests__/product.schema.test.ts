import { describe, it, expect } from 'vitest';
import { productFormSchema, PRODUCT_TYPE_CONFIG, formatPrice } from '../product.schema';

describe('productFormSchema', () => {
  const validInput = {
    name: 'Cuenco rústico',
    sku: 'CNC-001',
    slug: 'cuenco-rustico',
    barcode: null,
    product_type: 'physical' as const,
    category_id: null,
    base_price: 350,
    cost: null,
    tax_rate: 0.16,
    description: null,
    is_active: true,
    track_stock: true,
    image_url: null,
    metadata: null,
  };

  it('accepts valid input', () => {
    const result = productFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = productFormSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre es requerido');
    }
  });

  it('rejects empty SKU', () => {
    const result = productFormSchema.safeParse({ ...validInput, sku: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El SKU es requerido');
    }
  });

  it('rejects negative price', () => {
    const result = productFormSchema.safeParse({ ...validInput, base_price: -10 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El precio debe ser mayor o igual a 0');
    }
  });

  it('coerces price string to number', () => {
    const result = productFormSchema.safeParse({ ...validInput, base_price: '250' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.base_price).toBe(250);
    }
  });

  it('defaults product_type to physical', () => {
    const { product_type: _, ...withoutType } = validInput;
    const result = productFormSchema.safeParse(withoutType);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.product_type).toBe('physical');
    }
  });

  it('defaults tax_rate to 0.16', () => {
    const { tax_rate: _, ...withoutTax } = validInput;
    const result = productFormSchema.safeParse(withoutTax);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tax_rate).toBe(0.16);
    }
  });

  it('defaults is_active to true', () => {
    const { is_active: _, ...withoutActive } = validInput;
    const result = productFormSchema.safeParse(withoutActive);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
    }
  });

  it('accepts any string as image_url', () => {
    const result = productFormSchema.safeParse({ ...validInput, image_url: 'https://storage.example.com/img.jpg' });
    expect(result.success).toBe(true);
  });

  it('accepts null image_url', () => {
    const result = productFormSchema.safeParse({ ...validInput, image_url: null });
    expect(result.success).toBe(true);
  });

  it('validates product_type enum', () => {
    const result = productFormSchema.safeParse({ ...validInput, product_type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid slug format', () => {
    const result = productFormSchema.safeParse({ ...validInput, slug: 'INVALID SLUG!' });
    expect(result.success).toBe(false);
  });
});

describe('PRODUCT_TYPE_CONFIG', () => {
  it('has all 5 product types', () => {
    const types = Object.keys(PRODUCT_TYPE_CONFIG);
    expect(types).toHaveLength(5);
    expect(types).toEqual(
      expect.arrayContaining(['physical', 'service', 'event', 'course', 'digital']),
    );
  });

  it('each type has label and color', () => {
    for (const config of Object.values(PRODUCT_TYPE_CONFIG)) {
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('color');
      expect(config.label.length).toBeGreaterThan(0);
      expect(config.color.length).toBeGreaterThan(0);
    }
  });
});

describe('formatPrice', () => {
  it('formats Mexican pesos correctly', () => {
    const result = formatPrice(1500);
    // Intl may use different spacing, just verify it contains key parts
    expect(result).toContain('1,500');
    expect(result).toContain('$');
  });

  it('formats zero', () => {
    const result = formatPrice(0);
    expect(result).toContain('$');
    expect(result).toContain('0.00');
  });

  it('formats decimal prices', () => {
    const result = formatPrice(99.5);
    expect(result).toContain('99.50');
  });
});
