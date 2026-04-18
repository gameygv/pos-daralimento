-- Add payment method to sales tickets
DO $$ BEGIN
  CREATE TYPE metodo_pago AS ENUM ('efectivo', 'tarjeta', 'credito', 'transferencia', 'otros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE vtatkt ADD COLUMN IF NOT EXISTS metodo_pago text DEFAULT 'efectivo';
