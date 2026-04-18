-- Cash register sessions track who is using which register
CREATE TABLE IF NOT EXISTS caja_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id uuid NOT NULL REFERENCES cajas(id),
  user_id text NOT NULL,
  user_name text NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  monto_apertura numeric NOT NULL DEFAULT 0,
  monto_cierre numeric,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  corte_id int
);

CREATE INDEX idx_caja_sessions_caja ON caja_sessions(caja_id);
CREATE INDEX idx_caja_sessions_user ON caja_sessions(user_id);
CREATE INDEX idx_caja_sessions_status ON caja_sessions(status);

ALTER TABLE caja_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage caja_sessions" ON caja_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add session_id to vtatkt to track which session a sale belongs to
ALTER TABLE vtatkt ADD COLUMN IF NOT EXISTS caja_session_id uuid;

-- Junction table for user-caja assignments
CREATE TABLE IF NOT EXISTS caja_users (
  caja_id uuid NOT NULL REFERENCES cajas(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  PRIMARY KEY (caja_id, user_id)
);

ALTER TABLE caja_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage caja_users" ON caja_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
