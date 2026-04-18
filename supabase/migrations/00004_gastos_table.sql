CREATE TABLE IF NOT EXISTS gastos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  concepto text NOT NULL,
  monto numeric NOT NULL,
  categoria text,
  notas text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage gastos" ON gastos FOR ALL TO authenticated USING (true) WITH CHECK (true);
