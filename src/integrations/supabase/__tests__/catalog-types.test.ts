import { describe, it, expect } from 'vitest';
import type {
  Category, CategoryInsert, Product, ProductInsert,
  OptionGroup, OptionValue, ProductVariant, ProductVariantInsert,
  ProductAttribute, CategoryTreeNode, ProductSearchResult,
  ProductType, CatalogDatabase
} from '../catalog-types';

describe('Catalog Types', () => {
  describe('Category', () => {
    it('has required fields for hierarchy', () => {
      const category: Category = {
        id: 'uuid-1',
        name: 'Cuencos',
        slug: 'cuencos',
        description: 'Cuencos tibetanos',
        parent_id: null,
        sort_order: 0,
        is_active: true,
        image_url: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
      expect(category.name).toBe('Cuencos');
      expect(category.parent_id).toBeNull();
    });

    it('allows partial fields for insert', () => {
      const insert: CategoryInsert = {
        name: 'Talleres',
        slug: 'talleres',
      };
      expect(insert.name).toBe('Talleres');
      // parent_id, sort_order, is_active are optional in Insert
    });
  });

  describe('Product', () => {
    it('has all required fields including type and pricing', () => {
      const product: Product = {
        id: 'uuid-2',
        sku: 'CBT-001',
        barcode: '7501234567890',
        name: 'Cuenco Tibetano 20cm',
        slug: 'cuenco-tibetano-20cm',
        description: 'Cuenco tibetano artesanal',
        product_type: 'physical',
        category_id: 'uuid-1',
        base_price: 1500,
        cost: 800,
        tax_rate: 0.16,
        is_active: true,
        track_stock: true,
        image_url: null,
        metadata: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
      expect(product.product_type).toBe('physical');
      expect(product.base_price).toBe(1500);
      expect(product.tax_rate).toBe(0.16);
    });

    it('supports all 5 product types', () => {
      const types: ProductType[] = ['physical', 'service', 'event', 'course', 'digital'];
      expect(types).toHaveLength(5);
    });
  });

  describe('ProductVariant', () => {
    it('has independent stock and price override', () => {
      const variant: ProductVariant = {
        id: 'uuid-3',
        product_id: 'uuid-2',
        sku: 'CBT-001-M',
        barcode: null,
        price_override: 1600,
        cost_override: null,
        stock: 15,
        min_stock: 3,
        is_active: true,
        option_values: { Size: 'M' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
      expect(variant.stock).toBe(15);
      expect(variant.price_override).toBe(1600);
    });
  });

  describe('ProductAttribute', () => {
    it('has key-value structure', () => {
      const attr: ProductAttribute = {
        id: 'uuid-4',
        product_id: 'uuid-2',
        key: 'weight_grams',
        value: '450',
      };
      expect(attr.key).toBe('weight_grams');
    });
  });

  describe('Function return types', () => {
    it('CategoryTreeNode has depth field', () => {
      const node: CategoryTreeNode = {
        id: 'uuid-1',
        name: 'Cuencos',
        slug: 'cuencos',
        parent_id: null,
        depth: 0,
        sort_order: 0,
      };
      expect(node.depth).toBe(0);
    });

    it('ProductSearchResult has aggregated fields', () => {
      const result: ProductSearchResult = {
        id: 'uuid-2',
        sku: 'CBT-001',
        name: 'Cuenco Tibetano',
        slug: 'cuenco-tibetano',
        product_type: 'physical',
        base_price: 1500,
        is_active: true,
        category_name: 'Cuencos',
        variant_count: 3,
        total_stock: 45,
      };
      expect(result.variant_count).toBe(3);
      expect(result.total_stock).toBe(45);
      expect(result.category_name).toBe('Cuencos');
    });
  });

  describe('OptionGroup and OptionValue', () => {
    it('OptionGroup has name and sort_order', () => {
      const group: OptionGroup = {
        id: 'uuid-5',
        name: 'Tamano',
        sort_order: 0,
      };
      expect(group.name).toBe('Tamano');
    });

    it('OptionValue references a group', () => {
      const value: OptionValue = {
        id: 'uuid-6',
        group_id: 'uuid-5',
        value: 'Grande',
        sort_order: 2,
      };
      expect(value.group_id).toBe('uuid-5');
    });
  });
});
