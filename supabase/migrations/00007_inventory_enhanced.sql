-- Enhanced inventory movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste')),
  quantity int NOT NULL,
  previous_stock int NOT NULL,
  new_stock int NOT NULL,
  cost numeric,
  reference text,
  comments text,
  attachment_url text,
  created_by text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inv_movements_date ON inventory_movements(created_at);
CREATE INDEX idx_inv_movements_type ON inventory_movements(movement_type);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage inventory_movements" ON inventory_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create storage bucket for inventory attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory-attachments', 'inventory-attachments', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload inventory attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inventory-attachments');
CREATE POLICY "Public can view inventory attachments" ON storage.objects FOR SELECT TO public USING (bucket_id = 'inventory-attachments');
CREATE POLICY "Authenticated can delete inventory attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'inventory-attachments');
