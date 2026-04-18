-- Add secondary phone number to clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefono2 TEXT;
