-- Add per-caja folio numbering
ALTER TABLE cajas ADD COLUMN IF NOT EXISTS prefijo_folio text DEFAULT '';
ALTER TABLE cajas ADD COLUMN IF NOT EXISTS folio_actual int NOT NULL DEFAULT 0;

-- Update existing cajas with prefix based on row number
UPDATE cajas SET prefijo_folio = 'C1' WHERE prefijo_folio = '' OR prefijo_folio IS NULL;

-- Add folio_display to vtatkt for the formatted folio (e.g., "C1-256")
ALTER TABLE vtatkt ADD COLUMN IF NOT EXISTS folio_display text;
