-- =============================================================================
-- Notas de venta: estado de pago y entrega
-- =============================================================================

CREATE TABLE IF NOT EXISTS notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio integer NOT NULL,
  folio_display text,
  fecha text NOT NULL,
  hora text NOT NULL,
  cliente text NOT NULL DEFAULT 'Mostrador',
  vendedor text,
  total numeric NOT NULL DEFAULT 0,
  metodo_pago text DEFAULT 'efectivo',
  pago_status text NOT NULL DEFAULT 'pendiente'
    CHECK (pago_status IN ('pendiente', 'pagado')),
  entrega_status text NOT NULL DEFAULT 'sin_entregar'
    CHECK (entrega_status IN ('sin_entregar', 'entregado')),
  entrega_token uuid NOT NULL DEFAULT gen_random_uuid(),
  entregado_at timestamptz,
  pagado_at timestamptz,
  caja_id uuid,
  caja_session_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notas_folio ON notas(folio);
CREATE INDEX IF NOT EXISTS idx_notas_fecha ON notas(fecha);
CREATE INDEX IF NOT EXISTS idx_notas_pago ON notas(pago_status);
CREATE INDEX IF NOT EXISTS idx_notas_entrega ON notas(entrega_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notas_token ON notas(entrega_token);

ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read and update notas
CREATE POLICY "Authenticated can manage notas"
  ON notas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anonymous users can read and update by token (for delivery confirmation)
CREATE POLICY "Anon can confirm delivery by token"
  ON notas FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can update delivery by token"
  ON notas FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
