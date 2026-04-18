-- ============================================================
-- Credit system enhancements
-- ============================================================

-- Add credit limit to customers
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS limite_credito numeric NOT NULL DEFAULT 0;

-- Credit movements for detailed tracking
CREATE TABLE IF NOT EXISTS credito_movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id bigint NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('cargo', 'abono')),
  monto numeric NOT NULL,
  saldo_anterior numeric NOT NULL,
  saldo_nuevo numeric NOT NULL,
  referencia text,         -- folio de venta, ID de abono, etc.
  concepto text,
  metodo_pago text,        -- para abonos: efectivo, tarjeta, etc.
  created_by text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credito_mov_cliente ON credito_movimientos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_credito_mov_date ON credito_movimientos (created_at);
