import { describe, it, expect } from 'vitest';
import { generateVariants } from '../generateVariants';

describe('generateVariants', () => {
  it('returns empty array when no groups', () => {
    const result = generateVariants([], 'CNC-001');
    expect(result).toEqual([]);
  });

  it('returns empty array when all groups have no values', () => {
    const result = generateVariants(
      [{ name: 'Color', values: [] }],
      'CNC-001',
    );
    expect(result).toEqual([]);
  });

  it('generates variants for single group', () => {
    const result = generateVariants(
      [{ name: 'Tamano', values: ['S', 'M', 'L'] }],
      'cnc-001',
    );
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      sku: 'CNC-001-S',
      option_values: { Tamano: 'S' },
    });
    expect(result[1]).toEqual({
      sku: 'CNC-001-M',
      option_values: { Tamano: 'M' },
    });
    expect(result[2]).toEqual({
      sku: 'CNC-001-L',
      option_values: { Tamano: 'L' },
    });
  });

  it('generates cartesian product for two groups', () => {
    const result = generateVariants(
      [
        { name: 'Tamano', values: ['S', 'M'] },
        { name: 'Color', values: ['Rojo', 'Azul'] },
      ],
      'CNC-001',
    );
    expect(result).toHaveLength(4);
    expect(result).toEqual([
      { sku: 'CNC-001-S-ROJ', option_values: { Tamano: 'S', Color: 'Rojo' } },
      { sku: 'CNC-001-S-AZU', option_values: { Tamano: 'S', Color: 'Azul' } },
      { sku: 'CNC-001-M-ROJ', option_values: { Tamano: 'M', Color: 'Rojo' } },
      { sku: 'CNC-001-M-AZU', option_values: { Tamano: 'M', Color: 'Azul' } },
    ]);
  });

  it('generates cartesian product for three groups', () => {
    const result = generateVariants(
      [
        { name: 'Tamano', values: ['S', 'M'] },
        { name: 'Color', values: ['Rojo'] },
        { name: 'Material', values: ['Barro', 'Ceramica'] },
      ],
      'CNC',
    );
    expect(result).toHaveLength(4); // 2 x 1 x 2
    expect(result[0].option_values).toEqual({
      Tamano: 'S',
      Color: 'Rojo',
      Material: 'Barro',
    });
  });

  it('skips groups with empty values', () => {
    const result = generateVariants(
      [
        { name: 'Tamano', values: ['S', 'M'] },
        { name: 'Color', values: [] },
      ],
      'CNC-001',
    );
    expect(result).toHaveLength(2);
    expect(result[0].option_values).toEqual({ Tamano: 'S' });
  });

  it('abbreviates long value names to 3 chars', () => {
    const result = generateVariants(
      [{ name: 'Color', values: ['Rojo intenso'] }],
      'CNC',
    );
    expect(result[0].sku).toBe('CNC-ROJ');
  });

  it('uppercases SKU', () => {
    const result = generateVariants(
      [{ name: 'Size', values: ['small'] }],
      'abc-001',
    );
    expect(result[0].sku).toBe('ABC-001-SMA');
  });
});
