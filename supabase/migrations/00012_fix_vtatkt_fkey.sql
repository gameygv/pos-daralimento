-- Remove the foreign key constraint on vtatkt.art that references artimtr.codart
-- This is needed because the new POS uses the 'products' table, not 'artimtr'
-- The art column now stores the product SKU from the products table

ALTER TABLE vtatkt DROP CONSTRAINT IF EXISTS vtatkt_art_fkey;

-- Also add product_id column to link to the new products table (optional reference)
ALTER TABLE vtatkt ADD COLUMN IF NOT EXISTS product_id uuid;
