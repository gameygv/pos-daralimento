-- Categories
INSERT INTO categories (name, slug) VALUES ('Cerdo', 'cerdo');
INSERT INTO categories (name, slug) VALUES ('Pollo', 'pollo');
INSERT INTO categories (name, slug) VALUES ('Borrego', 'borrego');
INSERT INTO categories (name, slug) VALUES ('Res', 'res');
INSERT INTO categories (name, slug) VALUES ('Charcutería', 'charcuteria');
INSERT INTO categories (name, slug) VALUES ('Mascotas', 'mascotas');
INSERT INTO categories (name, slug) VALUES ('Otros', 'otros');

-- Products
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('GORDITAS DE CHICHARRÓN', 'gorditas-de-chicharron', 'DAR7935', 120, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('MANTECA 1/', 'manteca-1', 'DAR9355', 100, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('MANTECA', 'manteca', 'DAR2472', 180, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('FILETE', 'filete', 'DAR6336', 95, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO -CARNE MOLIDA', 'cerdo-carne-molida', 'DAR8346', 155, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Chorizo', 'cerdo-chorizo', 'DAR2423', 120, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Charcutería' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Caldo Hueso', 'cerdo-caldo-hueso', 'DAR3287', 200, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Rollo de tocino ahumado', 'cerdo-rollo-de-tocino-ahumado', 'DAR4768', 168, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - HIGADO', 'pollo-higado', 'DAR3192', 95, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('JERKY', 'jerky', 'DAR9132', 95, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Alimento para mascota crudo', 'alimento-para-mascota-crudo', 'DAR6611', 100, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Mascotas' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Costillas', 'borrego-costillas', 'DAR6164', 1105, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Cabeza de Lomo', 'borrego-cabeza-de-lomo', 'DAR3358', 330, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Salchicha cruda con Guajillo', 'borrego-salchicha-cruda-con-guajillo', 'DAR3891', 250, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Cabeza de Lomo', 'cerdo-cabeza-de-lomo', 'DAR7762', 500, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Borrego, salchicha chipotle aprox', 'borrego-salchicha-chipotle-aprox', 'DAR7835', 120, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Maciza', 'borrego-maciza', 'DAR8423', 280, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Chuleta', 'cerdo-chuleta', 'DAR9656', 180, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Lomo', 'borrego-lomo', 'DAR5485', 355, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Caldo de hueso', 'borrego-caldo-de-hueso', 'DAR6655', 200, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Pierna Ahumada', 'borrego-pierna-ahumada', 'DAR5238', 726, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - HIGADO', 'cerdo-higado', 'DAR8349', 105, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Salami c/ Miel (100 - )', 'salami-c-miel-100', 'DAR9893', 120, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Charcutería' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Alimento para mascota cocido', 'alimento-para-mascota-cocido', 'DAR5268', 100, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Mascotas' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Maciza', 'cerdo-maciza', 'DAR7834', 290, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('PORK BELLY', 'pork-belly', 'DAR9485', 666, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Queso Oaxaca ahumado x pz', 'queso-oaxaca-ahumado-x-pz', 'DAR3922', 150, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Otros' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Molida', 'borrego-molida', 'DAR5798', 270, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO Chicharrón ( )', 'cerdo-chicharron', 'DAR6563', 200, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO ENTERO', 'pollo-entero', 'DAR1795', 320, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - PECHUGA (625 - )', 'pollo-pechuga-625', 'DAR7898', 245, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - PIEZAS (715 - )', 'pollo-piezas-715', 'DAR9186', 210, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - PARTIDO', 'pollo-partido', 'DAR1745', 520, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - MOLLEJAS', 'pollo-mollejas', 'DAR4249', 95, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - CORAZÓN', 'pollo-corazon', 'DAR9973', 95, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - ALAS aprox.', 'pollo-alas-aprox', 'DAR8949', 200, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Salchicha chile morita', 'borrego-salchicha-chile-morita', 'DAR9285', 250, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Salami Borrego (100 - )', 'salami-borrego-100', 'DAR9515', 120, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - Caldo Hueso', 'pollo-caldo-hueso', 'DAR7986', 210, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('RES - Caldo Hueso', 'res-caldo-hueso', 'DAR1348', 200, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Res' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Tocino Ahumado', 'cerdo-tocino-ahumado', 'DAR2752', 167, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - COSTILLA', 'cerdo-costilla', 'DAR1315', 500, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Pierna Ahumada', 'cerdo-pierna-ahumada', 'DAR2124', 150, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Costilla Ahumada', 'cerdo-costilla-ahumada', 'DAR5274', 105, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Carne Brocheta', 'borrego-carne-brocheta', 'DAR2461', 223, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('RES- JERKY', 'res-jerky', 'DAR9354', 120, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Res' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Salami Argentino(200- )', 'salami-argentino-200', 'DAR1934', 220, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Charcutería' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Salami Argentino (150 - )', 'salami-argentino-150', 'DAR9187', 170, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Charcutería' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Salami Paprika y Chipotle (100- )', 'salami-paprika-y-chipotle-100', 'DAR2686', 120, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Charcutería' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Salami Italiano Ahumado (100 - )', 'salami-italiano-ahumado-100', 'DAR5943', 120, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Charcutería' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Rolló ahumado', 'borrego-rollo-ahumado', 'DAR7163', 170, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Lomo ahumado', 'cerdo-lomo-ahumado', 'DAR6813', 190, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Filete', 'borrego-filete', 'DAR5234', 125, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Salami c/ Miel (150 - )', 'salami-c-miel-150', 'DAR4658', 170, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Charcutería' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Lomo (555 - )', 'cerdo-lomo-555', 'DAR0001', 250, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - MEDIO POLLO', 'pollo-medio-pollo', 'DAR0002', 235, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('ALAS', 'alas', 'DAR0003', 210, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CORAZONES', 'corazones', 'DAR0004', 22, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('HIGADO', 'higado', 'DAR0005', 55, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('MITAD DE POLLO', 'mitad-de-pollo', 'DAR0006', 207, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('MOLLEJAS', 'mollejas', 'DAR0007', 50, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('PECHUGA', 'pechuga', 'DAR0008', 380.78, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('PIERNA Y MUSLO', 'pierna-y-muslo', 'DAR0009', 207.35, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO PARTIDO', 'pollo-partido', 'DAR0010', 416.25, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - SALCHICHA FRESCA DE AJO CON VINO', 'cerdo-salchicha-fresca-de-ajo-con-vino', 'DAR9958', 130, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Res' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Filete', 'cerdo-filete', 'DAR7294', 100, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Tocino rebanado', 'cerdo-tocino-rebanado', 'DAR2752', 150, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Salami Italiano Ahumado (250 - )', 'salami-italiano-ahumado-250', 'DAR5943', 275, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Charcutería' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Rollo ahumado', 'borrego-rollo-ahumado', 'DAR7163', 150, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - ENTERO', 'pollo-entero', 'DAR0011', 540, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - ALAS', 'pollo-alas', 'DAR0012', 210, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - CORAZONES', 'pollo-corazones', 'DAR0013', 22, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Higado', 'cerdo-higado', 'DAR0014', 111, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - PECHUGA', 'pollo-pechuga', 'DAR0015', 315, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - PECHUGA (.850- )', 'pollo-pechuga-850', 'DAR0016', 310, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - PIERNA Y MUSLO', 'pollo-pierna-y-muslo', 'DAR0017', 250, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Caldo de hueso', 'cerdo-caldo-de-hueso', 'DAR0018', 200, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Maciza', 'cerdo-maciza', 'DAR0019', 150, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Chorizo', 'cerdo-chorizo', 'DAR0020', 190, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Charcutería' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Chicharrón', 'cerdo-chicharron', 'DAR0021', 50, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Gorditas de Chicharrón 4pz', 'cerdo-gorditas-de-chicharron-4pz', 'DAR0022', 120, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Lomo', 'cerdo-lomo', 'DAR0023', 200, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Lomo ahumado', 'cerdo-lomo-ahumado', 'DAR0024', 150, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Jerky', 'cerdo-jerky', 'DAR0025', 100, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Rollo de Tocino', 'cerdo-rollo-de-tocino', 'DAR0026', 170, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Tocino rebanado', 'cerdo-tocino-rebanado', 'DAR0027', 150, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Pierna Ahumada', 'cerdo-pierna-ahumada', 'DAR0028', 150, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Copia de CERDO- Pierna Ahumada', 'copia-de-cerdo-pierna-ahumada', 'DAR0029', 150, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Copia de PIERNA Y MUSLO', 'copia-de-pierna-y-muslo', 'DAR0030', 210.25, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - MOLIDA', 'pollo-molida', 'DAR0031', 180, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Salchicha Guajillo', 'borrego-salchicha-guajillo', 'DAR0032', 250, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('BORREGO - Salchicha Chipotle', 'borrego-salchicha-chipotle', 'DAR0033', 250, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Borrego' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO- Manteca', 'cerdo-manteca', 'DAR0034', 180, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Copia de CERDO - Lomo (555 - )', 'copia-de-cerdo-lomo-555', 'DAR0035', 215, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('CERDO - Carne Molida', 'cerdo-carne-molida', 'DAR0036', 155, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Cerdo' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('Copia de CERDO- Chorizo', 'copia-de-cerdo-chorizo', 'DAR0037', 190, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Charcutería' LIMIT 1));
INSERT INTO products (name, slug, sku, base_price, cost, is_active, track_stock, product_type, category_id)
  VALUES ('POLLO - Chorizo', 'pollo-chorizo', 'DAR0038', 195, 0, true, true, 'physical',
  (SELECT id FROM categories WHERE name = 'Pollo' LIMIT 1));

-- Default variants with stock
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 10 FROM products WHERE sku = 'DAR7935';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR9355';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR2472';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR6336';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 9 FROM products WHERE sku = 'DAR8346';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR2423';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 8 FROM products WHERE sku = 'DAR3287';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 6 FROM products WHERE sku = 'DAR4768';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 3 FROM products WHERE sku = 'DAR3192';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 20 FROM products WHERE sku = 'DAR9132';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 12 FROM products WHERE sku = 'DAR6611';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR6164';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR3358';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 4 FROM products WHERE sku = 'DAR3891';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR7762';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR7835';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR8423';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR9656';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR5485';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 7 FROM products WHERE sku = 'DAR6655';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR5238';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR8349';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR9893';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 15 FROM products WHERE sku = 'DAR5268';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR7834';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR9485';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR3922';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR5798';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 3 FROM products WHERE sku = 'DAR6563';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR1795';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 3 FROM products WHERE sku = 'DAR7898';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 7 FROM products WHERE sku = 'DAR9186';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR1745';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR4249';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR9973';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR8949';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR9285';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 25 FROM products WHERE sku = 'DAR9515';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 8 FROM products WHERE sku = 'DAR7986';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 4 FROM products WHERE sku = 'DAR1348';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 20 FROM products WHERE sku = 'DAR2752';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR1315';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 20 FROM products WHERE sku = 'DAR2124';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR5274';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR2461';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 18 FROM products WHERE sku = 'DAR9354';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 3 FROM products WHERE sku = 'DAR1934';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR9187';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR2686';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 7 FROM products WHERE sku = 'DAR5943';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR7163';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 3 FROM products WHERE sku = 'DAR6813';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR5234';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 5 FROM products WHERE sku = 'DAR4658';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 3 FROM products WHERE sku = 'DAR0039';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR0040';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 3 FROM products WHERE sku = 'DAR0041';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR0042';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 5 FROM products WHERE sku = 'DAR0043';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR0044';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 5 FROM products WHERE sku = 'DAR0045';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 3 FROM products WHERE sku = 'DAR0046';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 5 FROM products WHERE sku = 'DAR0047';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR0048';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR9958';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR7294';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 20 FROM products WHERE sku = 'DAR2752';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 7 FROM products WHERE sku = 'DAR5943';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR7163';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR0049';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 3 FROM products WHERE sku = 'DAR0050';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR0051';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR0052';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR0053';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR0054';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR0055';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR0056';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR0057';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR0058';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR0059';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 7 FROM products WHERE sku = 'DAR0060';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR0061';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 3 FROM products WHERE sku = 'DAR0062';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 7 FROM products WHERE sku = 'DAR0063';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 4 FROM products WHERE sku = 'DAR0064';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR0065';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR0066';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR0067';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR0068';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 9 FROM products WHERE sku = 'DAR0069';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 4 FROM products WHERE sku = 'DAR0070';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR0071';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 1 FROM products WHERE sku = 'DAR0072';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 2 FROM products WHERE sku = 'DAR0073';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 7 FROM products WHERE sku = 'DAR0074';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 0 FROM products WHERE sku = 'DAR0075';
INSERT INTO product_variants (product_id, sku, stock)
  SELECT id, sku, 5 FROM products WHERE sku = 'DAR0076';

-- Clients
INSERT INTO clientes (nombre) VALUES ('Mostrador');
INSERT INTO clientes (nombre) VALUES ('TALLER RELACIONES');
INSERT INTO clientes (nombre) VALUES ('FAM');
INSERT INTO clientes (nombre) VALUES ('JORDANA');
INSERT INTO clientes (nombre) VALUES ('RENACER');
INSERT INTO clientes (nombre) VALUES ('PAG. WEB');
INSERT INTO clientes (nombre) VALUES ('GIL');
INSERT INTO clientes (nombre) VALUES ('FAM HOCH');
INSERT INTO clientes (nombre) VALUES ('GUS');
INSERT INTO clientes (nombre) VALUES ('CU�ADA');
INSERT INTO clientes (nombre) VALUES ('ARMANDO');
INSERT INTO clientes (nombre) VALUES ('NALLE');
INSERT INTO clientes (nombre) VALUES ('GUILLE');
INSERT INTO clientes (nombre) VALUES ('SOLAR');
INSERT INTO clientes (nombre) VALUES ('JIASU');
INSERT INTO clientes (nombre) VALUES ('STEFANO SALGADO');
INSERT INTO clientes (nombre) VALUES ('RESTAURANTES');
INSERT INTO clientes (nombre) VALUES ('FAM.  HOCH');
INSERT INTO clientes (nombre) VALUES ('AYUDANTE');
INSERT INTO clientes (nombre) VALUES ('GUSTAVO');
INSERT INTO clientes (nombre) VALUES ('VERANALLE');
INSERT INTO clientes (nombre) VALUES ('LAURA GISELA PW');
INSERT INTO clientes (nombre) VALUES ('ANA KARLA PW');
INSERT INTO clientes (nombre) VALUES ('HANIEL PW');
INSERT INTO clientes (nombre) VALUES ('LA PIZCA');
INSERT INTO clientes (nombre) VALUES ('LORE ALVARADO');
INSERT INTO clientes (nombre) VALUES ('PAG WEB');
INSERT INTO clientes (nombre) VALUES ('SIDNEY PW');
INSERT INTO clientes (nombre) VALUES ('ROSA A PW');
INSERT INTO clientes (nombre) VALUES ('DALIA PW');
INSERT INTO clientes (nombre) VALUES ('PUB. GRAL');
INSERT INTO clientes (nombre) VALUES ('PAGINA WEB');
INSERT INTO clientes (nombre) VALUES ('FLORENCIA PW');
INSERT INTO clientes (nombre) VALUES ('LA  PIZCA');
INSERT INTO clientes (nombre) VALUES ('ROSA PW');
INSERT INTO clientes (nombre) VALUES ('MOLIDA');
INSERT INTO clientes (nombre) VALUES ('YANINA');
INSERT INTO clientes (nombre) VALUES ('AMARANTO');
