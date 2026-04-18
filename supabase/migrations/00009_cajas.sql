CREATE TABLE IF NOT EXISTS cajas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  tienda text DEFAULT 'Principal',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage cajas" ON cajas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default caja
INSERT INTO cajas (nombre, tienda) VALUES ('Caja 1', 'Principal');

-- Add caja_id to vtatkt for tracking which register made the sale
ALTER TABLE vtatkt ADD COLUMN IF NOT EXISTS caja_id uuid;

-- Add caja_id to corte
ALTER TABLE corte ADD COLUMN IF NOT EXISTS caja_id uuid;
