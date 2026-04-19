-- Mapeo de productos POS ↔ WooCommerce
CREATE TABLE IF NOT EXISTS product_wc_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  wc_product_id integer NOT NULL,
  wc_product_name text,
  synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (product_id),
  UNIQUE (wc_product_id)
);

ALTER TABLE product_wc_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage product_wc_map"
  ON product_wc_map FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_product_wc_map_product ON product_wc_map(product_id);
CREATE INDEX idx_product_wc_map_wc ON product_wc_map(wc_product_id);
