-- Configuración de notificaciones WhatsApp (Green API)
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- single row
  enabled boolean NOT NULL DEFAULT false,
  chat_type text NOT NULL DEFAULT 'none' CHECK (chat_type IN ('none', 'number', 'group')),
  chat_id text DEFAULT NULL, -- e.g. 5215512345678@c.us or 120363XXX@g.us
  chat_label text DEFAULT NULL, -- friendly name for display
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage whatsapp_config"
  ON whatsapp_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default row
INSERT INTO whatsapp_config (id, enabled, chat_type) VALUES (1, false, 'none')
  ON CONFLICT (id) DO NOTHING;
