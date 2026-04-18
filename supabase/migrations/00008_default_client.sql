-- Ensure default "Mostrador" client exists
INSERT INTO clientes (nombre, telefono, email, direccion, rfc, saldo)
SELECT 'Mostrador', NULL, NULL, NULL, NULL, 0
WHERE NOT EXISTS (
  SELECT 1 FROM clientes WHERE nombre = 'Mostrador'
);
