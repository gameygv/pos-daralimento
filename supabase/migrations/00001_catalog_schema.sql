-- Migration: 00001_catalog_schema.sql
-- Description: Catalog schema — categories, products, variants, options, attributes
-- Epic: E1 — Migración de Base y Catálogo Universal
-- Story: S1.2

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE product_type AS ENUM (
  'physical',
  'service',
  'event',
  'course',
  'digital'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Categories (hierarchical via adjacency list)
CREATE TABLE categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  description text,
  parent_id   uuid        REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  image_url   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE products (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  sku          text         NOT NULL UNIQUE,
  barcode      text,
  name         text         NOT NULL,
  slug         text         NOT NULL UNIQUE,
  description  text,
  product_type product_type NOT NULL DEFAULT 'physical',
  category_id  uuid         REFERENCES categories(id) ON DELETE SET NULL,
  base_price   numeric      NOT NULL,
  cost         numeric,
  tax_rate     numeric      NOT NULL DEFAULT 0.16,
  is_active    boolean      NOT NULL DEFAULT true,
  track_stock  boolean      NOT NULL DEFAULT true,
  image_url    text,
  metadata     jsonb,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

-- Option Groups (global, reusable across products)
CREATE TABLE option_groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

-- Option Values (belong to a group)
CREATE TABLE option_values (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  value      text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

-- Product-Option Group junction (which groups apply to which product)
CREATE TABLE product_option_groups (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_id   uuid NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, group_id)
);

-- Product Variants
CREATE TABLE product_variants (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku            text        NOT NULL UNIQUE,
  barcode        text,
  price_override numeric,
  cost_override  numeric,
  stock          int         NOT NULL DEFAULT 0,
  min_stock      int         NOT NULL DEFAULT 0,
  is_active      boolean     NOT NULL DEFAULT true,
  option_values  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Product Attributes (key-value pairs for extensibility)
CREATE TABLE product_attributes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key        text NOT NULL,
  value      text NOT NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_categories_parent_id    ON categories(parent_id);
CREATE INDEX idx_categories_slug         ON categories(slug);
CREATE INDEX idx_products_category_id    ON products(category_id);
CREATE INDEX idx_products_sku            ON products(sku);
CREATE INDEX idx_products_barcode        ON products(barcode);
CREATE INDEX idx_products_slug           ON products(slug);
CREATE INDEX idx_products_product_type   ON products(product_type);
CREATE INDEX idx_option_values_group_id  ON option_values(group_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku    ON product_variants(sku);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode);
CREATE INDEX idx_product_attributes_product_id ON product_attributes(product_id);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- DEFAULT VARIANT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION create_default_variant()
RETURNS trigger AS $$
BEGIN
  -- Only create default variant if none exists for this product
  IF NOT EXISTS (
    SELECT 1 FROM product_variants WHERE product_id = NEW.id
  ) THEN
    INSERT INTO product_variants (product_id, sku, price_override, stock, option_values)
    VALUES (
      NEW.id,
      NEW.sku || '-DEFAULT',
      NULL,
      0,
      '{}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_default_variant
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION create_default_variant();

-- =============================================================================
-- RPC: get_category_tree()
-- =============================================================================

CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS TABLE (
  id         uuid,
  name       text,
  slug       text,
  parent_id  uuid,
  depth      int,
  sort_order int
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE tree AS (
    SELECT
      c.id,
      c.name,
      c.slug,
      c.parent_id,
      0 AS depth,
      c.sort_order
    FROM categories c
    WHERE c.parent_id IS NULL
      AND c.is_active = true

    UNION ALL

    SELECT
      c.id,
      c.name,
      c.slug,
      c.parent_id,
      t.depth + 1,
      c.sort_order
    FROM categories c
    INNER JOIN tree t ON c.parent_id = t.id
    WHERE c.is_active = true
  )
  SELECT
    tree.id,
    tree.name,
    tree.slug,
    tree.parent_id,
    tree.depth,
    tree.sort_order
  FROM tree
  ORDER BY tree.depth, tree.sort_order;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- RPC: search_products()
-- =============================================================================

CREATE OR REPLACE FUNCTION search_products(
  p_query        text    DEFAULT NULL,
  p_category_id  uuid    DEFAULT NULL,
  p_product_type text    DEFAULT NULL,
  p_limit        int     DEFAULT 50,
  p_offset       int     DEFAULT 0
)
RETURNS TABLE (
  id             uuid,
  sku            text,
  name           text,
  slug           text,
  product_type   product_type,
  base_price     numeric,
  is_active      boolean,
  category_name  text,
  variant_count  bigint,
  total_stock    bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.sku,
    p.name,
    p.slug,
    p.product_type,
    p.base_price,
    p.is_active,
    c.name AS category_name,
    COUNT(pv.id) AS variant_count,
    COALESCE(SUM(pv.stock), 0) AS total_stock
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  WHERE
    (p_query IS NULL OR (
      p.name ILIKE '%' || p_query || '%'
      OR p.sku ILIKE '%' || p_query || '%'
      OR p.barcode ILIKE '%' || p_query || '%'
    ))
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_product_type IS NULL OR p.product_type = p_product_type::product_type)
  GROUP BY p.id, p.sku, p.name, p.slug, p.product_type, p.base_price, p.is_active, c.name
  ORDER BY p.name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users can read
CREATE POLICY "Authenticated users can read categories"
  ON categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read option_groups"
  ON option_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read option_values"
  ON option_values FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read product_option_groups"
  ON product_option_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read product_variants"
  ON product_variants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read product_attributes"
  ON product_attributes FOR SELECT TO authenticated USING (true);

-- INSERT: authenticated users can insert (refined in E5 for roles)
CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert option_groups"
  ON option_groups FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert option_values"
  ON option_values FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert product_option_groups"
  ON product_option_groups FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert product_variants"
  ON product_variants FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert product_attributes"
  ON product_attributes FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE: authenticated users can update (refined in E5 for roles)
CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can update option_groups"
  ON option_groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can update option_values"
  ON option_values FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_option_groups"
  ON product_option_groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_variants"
  ON product_variants FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_attributes"
  ON product_attributes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DELETE: authenticated users can delete (refined in E5 for roles)
CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete option_groups"
  ON option_groups FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete option_values"
  ON option_values FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete product_option_groups"
  ON product_option_groups FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete product_variants"
  ON product_variants FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete product_attributes"
  ON product_attributes FOR DELETE TO authenticated USING (true);
