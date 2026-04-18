-- =============================================================================
-- Storage bucket for product images
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public read access
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

-- =============================================================================
-- Update search_products() to return image_url
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
  total_stock    bigint,
  image_url      text
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
    COALESCE(SUM(pv.stock), 0) AS total_stock,
    p.image_url
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
  GROUP BY p.id, p.sku, p.name, p.slug, p.product_type, p.base_price, p.is_active, c.name, p.image_url
  ORDER BY p.name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
