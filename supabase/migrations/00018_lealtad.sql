-- ============================================================
-- Loyalty program
-- ============================================================

-- Loyalty config (single row)
CREATE TABLE IF NOT EXISTS lealtad_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  activo boolean NOT NULL DEFAULT false,
  puntos_por_peso numeric NOT NULL DEFAULT 1,       -- points earned per $1 spent
  valor_punto numeric NOT NULL DEFAULT 0.10,         -- $ value when redeeming 1 point
  -- Tier thresholds (cumulative points)
  umbral_plata int NOT NULL DEFAULT 500,
  umbral_oro int NOT NULL DEFAULT 2000,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure config row exists
INSERT INTO lealtad_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Customer loyalty points
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS puntos_lealtad int NOT NULL DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS puntos_acumulados int NOT NULL DEFAULT 0;

-- Points transaction log
CREATE TABLE IF NOT EXISTS lealtad_movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id bigint NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('acumular', 'canjear', 'ajuste')),
  puntos int NOT NULL,
  puntos_anterior int NOT NULL,
  puntos_nuevo int NOT NULL,
  referencia text,
  concepto text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lealtad_mov_cliente ON lealtad_movimientos (cliente_id);
