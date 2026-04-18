-- =============================================================================
-- Expense categories with parent/child hierarchy
-- =============================================================================

CREATE TABLE IF NOT EXISTS gasto_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  parent_id uuid REFERENCES gasto_categorias(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gasto_cat_parent ON gasto_categorias(parent_id);

ALTER TABLE gasto_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage gasto_categorias"
  ON gasto_categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default parent categories
INSERT INTO gasto_categorias (nombre, parent_id) VALUES
  ('Sueldos', NULL),
  ('Papelería', NULL),
  ('Insumos', NULL),
  ('General', NULL);

-- Change gastos.categoria from free text to FK
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS categoria_id uuid REFERENCES gasto_categorias(id);
