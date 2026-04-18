-- ============================================================
-- Multi-warehouse inventory with Kardex traceability
-- ============================================================

-- Warehouses / storage locations
CREATE TABLE IF NOT EXISTS almacenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  direccion text,
  tienda_id uuid REFERENCES tiendas(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Stock per warehouse per variant
CREATE TABLE IF NOT EXISTS almacen_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  almacen_id uuid NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  stock int NOT NULL DEFAULT 0,
  min_stock int NOT NULL DEFAULT 0,
  UNIQUE (almacen_id, variant_id)
);

-- Kardex: full traceability of every movement
CREATE TABLE IF NOT EXISTS kardex (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  almacen_id uuid NOT NULL REFERENCES almacenes(id),
  variant_id uuid NOT NULL REFERENCES product_variants(id),
  product_id uuid NOT NULL REFERENCES products(id),
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'venta', 'devolucion', 'transferencia_entrada', 'transferencia_salida')),
  cantidad int NOT NULL,
  stock_anterior int NOT NULL,
  stock_nuevo int NOT NULL,
  costo numeric,
  referencia text,       -- folio de venta, ID de transferencia, etc.
  comentario text,
  created_by text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Transfers between warehouses
CREATE TABLE IF NOT EXISTS transferencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  almacen_origen_id uuid NOT NULL REFERENCES almacenes(id),
  almacen_destino_id uuid NOT NULL REFERENCES almacenes(id),
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_transito', 'completada', 'cancelada')),
  notas text,
  created_by text,
  created_by_name text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Transfer line items
CREATE TABLE IF NOT EXISTS transferencia_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transferencia_id uuid NOT NULL REFERENCES transferencias(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(id),
  product_id uuid NOT NULL REFERENCES products(id),
  cantidad int NOT NULL CHECK (cantidad > 0)
);

-- Create a default warehouse if none exists
INSERT INTO almacenes (nombre, descripcion, is_default)
SELECT 'Principal', 'Almacen principal', true
WHERE NOT EXISTS (SELECT 1 FROM almacenes LIMIT 1);

-- Indexes for Kardex queries
CREATE INDEX IF NOT EXISTS idx_kardex_almacen ON kardex (almacen_id);
CREATE INDEX IF NOT EXISTS idx_kardex_variant ON kardex (variant_id);
CREATE INDEX IF NOT EXISTS idx_kardex_date ON kardex (created_at);
CREATE INDEX IF NOT EXISTS idx_kardex_tipo ON kardex (tipo);
CREATE INDEX IF NOT EXISTS idx_almacen_stock_almacen ON almacen_stock (almacen_id);
CREATE INDEX IF NOT EXISTS idx_almacen_stock_variant ON almacen_stock (variant_id);
