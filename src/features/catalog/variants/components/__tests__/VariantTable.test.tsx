import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VariantTable } from '../VariantTable';
import type { ProductVariant } from '@/integrations/supabase/catalog-types';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const makeVariant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  id: 'v1',
  product_id: 'p1',
  sku: 'CNC-001-S-ROJ',
  barcode: null,
  price_override: null,
  cost_override: null,
  stock: 10,
  min_stock: 0,
  is_active: true,
  option_values: { Tamano: 'S', Color: 'Rojo' },
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  ...overrides,
});

describe('VariantTable', () => {
  it('renders empty state when no variants', () => {
    render(
      <VariantTable
        variants={[]}
        optionGroupNames={['Tamano', 'Color']}
        onUpdateVariant={vi.fn()}
      />,
    );
    expect(screen.getByText('No hay variantes generadas')).toBeInTheDocument();
  });

  it('renders column headers for option groups and variant fields', () => {
    render(
      <VariantTable
        variants={[makeVariant()]}
        optionGroupNames={['Tamano', 'Color']}
        onUpdateVariant={vi.fn()}
      />,
    );
    expect(screen.getByText('Tamano')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Precio override')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('renders variant option values', () => {
    render(
      <VariantTable
        variants={[makeVariant()]}
        optionGroupNames={['Tamano', 'Color']}
        onUpdateVariant={vi.fn()}
      />,
    );
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('Rojo')).toBeInTheDocument();
  });

  it('renders editable SKU input with correct value', () => {
    render(
      <VariantTable
        variants={[makeVariant({ sku: 'MY-SKU' })]}
        optionGroupNames={[]}
        onUpdateVariant={vi.fn()}
      />,
    );
    const skuInput = screen.getByDisplayValue('MY-SKU');
    expect(skuInput).toBeInTheDocument();
  });

  it('renders editable stock input', () => {
    render(
      <VariantTable
        variants={[makeVariant({ stock: 25 })]}
        optionGroupNames={[]}
        onUpdateVariant={vi.fn()}
      />,
    );
    const stockInput = screen.getByDisplayValue('25');
    expect(stockInput).toBeInTheDocument();
  });

  it('filters out default variant when explicit variants exist', () => {
    const defaultVariant = makeVariant({ id: 'default', sku: 'CNC-DEFAULT', option_values: {} });
    const explicitVariant = makeVariant({ id: 'v1', sku: 'CNC-001-S', option_values: { Tamano: 'S' } });

    render(
      <VariantTable
        variants={[defaultVariant, explicitVariant]}
        optionGroupNames={['Tamano']}
        onUpdateVariant={vi.fn()}
      />,
    );
    expect(screen.queryByDisplayValue('CNC-DEFAULT')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('CNC-001-S')).toBeInTheDocument();
  });

  it('shows default variant when no explicit variants', () => {
    const defaultVariant = makeVariant({ id: 'default', sku: 'CNC-DEFAULT', option_values: {} });

    render(
      <VariantTable
        variants={[defaultVariant]}
        optionGroupNames={[]}
        onUpdateVariant={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('CNC-DEFAULT')).toBeInTheDocument();
  });

  it('renders multiple variants', () => {
    render(
      <VariantTable
        variants={[
          makeVariant({ id: 'v1', sku: 'CNC-S', option_values: { Tamano: 'S' } }),
          makeVariant({ id: 'v2', sku: 'CNC-M', option_values: { Tamano: 'M' } }),
          makeVariant({ id: 'v3', sku: 'CNC-L', option_values: { Tamano: 'L' } }),
        ]}
        optionGroupNames={['Tamano']}
        onUpdateVariant={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('CNC-S')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CNC-M')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CNC-L')).toBeInTheDocument();
  });
});
