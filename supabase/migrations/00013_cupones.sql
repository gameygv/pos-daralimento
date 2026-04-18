-- Coupon system
CREATE TABLE IF NOT EXISTS cupones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  descripcion text,
  tipo text NOT NULL CHECK (tipo IN ('porcentaje', 'monto')),
  valor numeric NOT NULL CHECK (valor > 0),
  monto_minimo numeric DEFAULT 0,
  usos_maximos integer,
  usos_actuales integer DEFAULT 0,
  activo boolean DEFAULT true,
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cupones_read" ON cupones FOR SELECT USING (true);
CREATE POLICY "cupones_write" ON cupones FOR ALL USING (true);
