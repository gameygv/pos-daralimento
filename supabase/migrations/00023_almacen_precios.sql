-- Precios por producto por almacén (punto de venta)
-- Cada producto tiene un precio público (menudeo) y precio proveedores (mayoreo)
-- que varía por punto de venta.

CREATE TABLE IF NOT EXISTS almacen_precios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  almacen_id uuid NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  precio_publico numeric NOT NULL DEFAULT 0,
  precio_proveedores numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (almacen_id, product_id)
);

-- RLS
ALTER TABLE almacen_precios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read almacen_precios"
  ON almacen_precios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert almacen_precios"
  ON almacen_precios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update almacen_precios"
  ON almacen_precios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete almacen_precios"
  ON almacen_precios FOR DELETE TO authenticated USING (true);

-- Index for fast lookups
CREATE INDEX idx_almacen_precios_almacen ON almacen_precios(almacen_id);
CREATE INDEX idx_almacen_precios_product ON almacen_precios(product_id);
