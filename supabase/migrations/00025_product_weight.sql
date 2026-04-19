-- Peso del producto en gramos (para cálculo automático de precios)
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_grams numeric DEFAULT NULL;
