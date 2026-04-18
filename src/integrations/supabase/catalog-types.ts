// src/integrations/supabase/catalog-types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductType = 'physical' | 'service' | 'event' | 'course' | 'digital';

export interface CatalogDatabase {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          sort_order: number;
          is_active: boolean;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          barcode: string | null;
          name: string;
          slug: string;
          description: string | null;
          product_type: ProductType;
          category_id: string | null;
          base_price: number;
          precio_mayoreo: number;
          cost: number | null;
          tax_rate: number;
          is_active: boolean;
          track_stock: boolean;
          image_url: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          barcode?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          product_type?: ProductType;
          category_id?: string | null;
          base_price: number;
          precio_mayoreo?: number;
          cost?: number | null;
          tax_rate?: number;
          is_active?: boolean;
          track_stock?: boolean;
          image_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          barcode?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          product_type?: ProductType;
          category_id?: string | null;
          base_price?: number;
          precio_mayoreo?: number;
          cost?: number | null;
          tax_rate?: number;
          is_active?: boolean;
          track_stock?: boolean;
          image_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      option_groups: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
        };
      };
      option_values: {
        Row: {
          id: string;
          group_id: string;
          value: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          group_id: string;
          value: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          group_id?: string;
          value?: string;
          sort_order?: number;
        };
      };
      product_option_groups: {
        Row: {
          product_id: string;
          group_id: string;
        };
        Insert: {
          product_id: string;
          group_id: string;
        };
        Update: {
          product_id?: string;
          group_id?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          barcode: string | null;
          price_override: number | null;
          cost_override: number | null;
          stock: number;
          min_stock: number;
          is_active: boolean;
          option_values: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          barcode?: string | null;
          price_override?: number | null;
          cost_override?: number | null;
          stock?: number;
          min_stock?: number;
          is_active?: boolean;
          option_values?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          barcode?: string | null;
          price_override?: number | null;
          cost_override?: number | null;
          stock?: number;
          min_stock?: number;
          is_active?: boolean;
          option_values?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_attributes: {
        Row: {
          id: string;
          product_id: string;
          key: string;
          value: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          key: string;
          value: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          key?: string;
          value?: string;
        };
      };
    };
    Functions: {
      get_category_tree: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          depth: number;
          sort_order: number;
        }[];
      };
      search_products: {
        Args: {
          p_query?: string | null;
          p_category_id?: string | null;
          p_product_type?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          sku: string;
          name: string;
          slug: string;
          product_type: ProductType;
          base_price: number;
          precio_mayoreo: number;
          is_active: boolean;
          category_name: string | null;
          variant_count: number;
          total_stock: number;
          image_url: string | null;
        }[];
      };
    };
    Enums: {
      product_type: ProductType;
    };
  };
}

// Convenience type aliases
export type Category = CatalogDatabase['public']['Tables']['categories']['Row'];
export type CategoryInsert = CatalogDatabase['public']['Tables']['categories']['Insert'];
export type Product = CatalogDatabase['public']['Tables']['products']['Row'];
export type ProductInsert = CatalogDatabase['public']['Tables']['products']['Insert'];
export type OptionGroup = CatalogDatabase['public']['Tables']['option_groups']['Row'];
export type OptionValue = CatalogDatabase['public']['Tables']['option_values']['Row'];
export type ProductVariant = CatalogDatabase['public']['Tables']['product_variants']['Row'];
export type ProductVariantInsert = CatalogDatabase['public']['Tables']['product_variants']['Insert'];
export type ProductAttribute = CatalogDatabase['public']['Tables']['product_attributes']['Row'];

export type CategoryTreeNode = CatalogDatabase['public']['Functions']['get_category_tree']['Returns'][number];
export type ProductSearchResult = CatalogDatabase['public']['Functions']['search_products']['Returns'][number];
