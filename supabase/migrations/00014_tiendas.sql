-- Multi-store system
CREATE TABLE IF NOT EXISTS tiendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  direccion text,
  telefono text,
  is_active boolean NOT NULL DEFAULT true,
  is_secret boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tiendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiendas_all" ON tiendas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User-store assignments (empty = everyone has access)
CREATE TABLE IF NOT EXISTS tienda_users (
  tienda_id uuid NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  PRIMARY KEY (tienda_id, user_id)
);

ALTER TABLE tienda_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tienda_users_all" ON tienda_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Link cajas to tiendas (nullable for backwards compat)
ALTER TABLE cajas ADD COLUMN IF NOT EXISTS tienda_id uuid REFERENCES tiendas(id);

-- Add modo_seguro_t to config
ALTER TABLE pvcntl ADD COLUMN IF NOT EXISTS modo_seguro_t boolean DEFAULT false;

-- Insert default tienda and link existing cajas
INSERT INTO tiendas (id, nombre, direccion) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Principal', 'Sucursal principal');

UPDATE cajas SET tienda_id = '00000000-0000-0000-0000-000000000001' WHERE tienda_id IS NULL;
