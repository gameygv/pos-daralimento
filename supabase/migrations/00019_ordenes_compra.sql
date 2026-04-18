-- ============================================================
-- Purchase Orders
-- ============================================================

-- Suppliers
CREATE TABLE IF NOT EXISTS proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  contacto text,
  telefono text,
  email text,
  direccion text,
  notas text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio serial,
  proveedor_id uuid REFERENCES proveedores(id),
  proveedor_nombre text NOT NULL,
  status text NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'enviada', 'parcial', 'recibida', 'cancelada')),
  almacen_destino_id uuid REFERENCES almacenes(id),
  subtotal numeric NOT NULL DEFAULT 0,
  impuestos numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notas text,
  fecha_esperada date,
  created_by text,
  created_by_name text,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase order line items
CREATE TABLE IF NOT EXISTS orden_compra_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id uuid NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  descripcion text NOT NULL,
  cantidad_ordenada int NOT NULL CHECK (cantidad_ordenada > 0),
  cantidad_recibida int NOT NULL DEFAULT 0,
  costo_unitario numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_oc_status ON ordenes_compra (status);
CREATE INDEX IF NOT EXISTS idx_oc_proveedor ON ordenes_compra (proveedor_id);
