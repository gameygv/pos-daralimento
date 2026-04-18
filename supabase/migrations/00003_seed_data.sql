-- Migration: 00003_seed_data.sql
-- Description: Seed data for The Elephant Bowl POS
-- Categories, products, option groups, and option values

-- =============================================================================
-- CATEGORIES (top-level)
-- =============================================================================

INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active) VALUES
('Cuencos Tibetanos', 'cuencos-tibetanos', 'Cuencos tibetanos artesanales para meditación y terapia', NULL, 1, true),
('Talleres', 'talleres', 'Talleres de cuencoterapia y meditación', NULL, 2, true),
('Cursos', 'cursos', 'Cursos de formación en cuencoterapia', NULL, 3, true),
('Eventos', 'eventos', 'Conciertos y eventos especiales', NULL, 4, true),
('Souvenirs', 'souvenirs', 'Artículos de recuerdo y regalo', NULL, 5, true),
('Artículos de Terapia', 'articulos-terapia', 'Complementos para cuencoterapia', NULL, 6, true);

-- =============================================================================
-- CATEGORIES (sub-categories)
-- =============================================================================

INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active) VALUES
('Cuencos Pequeños', 'cuencos-pequenos', 'Cuencos de 10-15cm', (SELECT id FROM categories WHERE slug = 'cuencos-tibetanos'), 1, true),
('Cuencos Medianos', 'cuencos-medianos', 'Cuencos de 16-22cm', (SELECT id FROM categories WHERE slug = 'cuencos-tibetanos'), 2, true),
('Cuencos Grandes', 'cuencos-grandes', 'Cuencos de 23-35cm', (SELECT id FROM categories WHERE slug = 'cuencos-tibetanos'), 3, true),
('Talleres Grupales', 'talleres-grupales', 'Talleres para grupos', (SELECT id FROM categories WHERE slug = 'talleres'), 1, true),
('Talleres Privados', 'talleres-privados', 'Sesiones privadas', (SELECT id FROM categories WHERE slug = 'talleres'), 2, true),
('Inciensos', 'inciensos', 'Inciensos naturales', (SELECT id FROM categories WHERE slug = 'articulos-terapia'), 1, true),
('Cojines', 'cojines', 'Cojines de meditación', (SELECT id FROM categories WHERE slug = 'articulos-terapia'), 2, true),
('Mazos y Baquetas', 'mazos-baquetas', 'Accesorios para cuencos', (SELECT id FROM categories WHERE slug = 'articulos-terapia'), 3, true);

-- =============================================================================
-- PRODUCTS
-- =============================================================================

INSERT INTO products (sku, name, slug, description, product_type, category_id, base_price, cost, tax_rate, is_active, track_stock) VALUES
('CBT-001', 'Cuenco Tibetano 12cm Bronce', 'cuenco-tibetano-12cm-bronce', 'Cuenco tibetano artesanal de bronce, ideal para principiantes', 'physical', (SELECT id FROM categories WHERE slug = 'cuencos-pequenos'), 850.00, 400.00, 0.16, true, true),
('CBT-002', 'Cuenco Tibetano 18cm Siete Metales', 'cuenco-tibetano-18cm-siete-metales', 'Cuenco de siete metales, sonido profundo', 'physical', (SELECT id FROM categories WHERE slug = 'cuencos-medianos'), 2500.00, 1200.00, 0.16, true, true),
('CBT-003', 'Cuenco Tibetano 25cm Premium', 'cuenco-tibetano-25cm-premium', 'Cuenco grande premium, ideal para terapia profesional', 'physical', (SELECT id FROM categories WHERE slug = 'cuencos-grandes'), 4500.00, 2200.00, 0.16, true, true),
('CBT-004', 'Cuenco Tibetano 30cm Maestro', 'cuenco-tibetano-30cm-maestro', 'Cuenco de maestro para ceremonias y terapia avanzada', 'physical', (SELECT id FROM categories WHERE slug = 'cuencos-grandes'), 7500.00, 3800.00, 0.16, true, true),
('TLL-001', 'Taller Grupal Intro Cuencos', 'taller-grupal-intro-cuencos', 'Taller introductorio de 2 horas, grupos de hasta 10 personas', 'service', (SELECT id FROM categories WHERE slug = 'talleres-grupales'), 500.00, 100.00, 0.16, true, false),
('TLL-002', 'Sesión Privada Cuencoterapia', 'sesion-privada-cuencoterapia', 'Sesión privada de cuencoterapia de 1 hora', 'service', (SELECT id FROM categories WHERE slug = 'talleres-privados'), 1200.00, 200.00, 0.16, true, false),
('CRS-001', 'Curso Certificación Nivel 1', 'curso-certificacion-nivel-1', 'Curso de certificación en cuencoterapia, 20 horas', 'course', (SELECT id FROM categories WHERE slug = 'cursos'), 8500.00, 2000.00, 0.16, true, false),
('CRS-002', 'Curso Meditación con Cuencos', 'curso-meditacion-cuencos', 'Curso de meditación guiada con cuencos, 8 horas', 'course', (SELECT id FROM categories WHERE slug = 'cursos'), 3500.00, 800.00, 0.16, true, false),
('EVT-001', 'Concierto de Cuencos', 'concierto-cuencos', 'Concierto meditativo de cuencos tibetanos', 'event', (SELECT id FROM categories WHERE slug = 'eventos'), 350.00, 50.00, 0.16, true, false),
('EVT-002', 'Baño de Sonido Grupal', 'bano-sonido-grupal', 'Experiencia de baño de sonido para 20 personas', 'event', (SELECT id FROM categories WHERE slug = 'eventos'), 450.00, 80.00, 0.16, true, false),
('SVN-001', 'Llavero Cuenco Miniatura', 'llavero-cuenco-miniatura', 'Llavero con cuenco tibetano miniatura funcional', 'physical', (SELECT id FROM categories WHERE slug = 'souvenirs'), 180.00, 60.00, 0.16, true, true),
('SVN-002', 'Playera The Elephant Bowl', 'playera-elephant-bowl', 'Playera con logo de The Elephant Bowl', 'physical', (SELECT id FROM categories WHERE slug = 'souvenirs'), 350.00, 120.00, 0.16, true, true),
('INC-001', 'Incienso Nag Champa (caja 15)', 'incienso-nag-champa', 'Caja de 15 barras de incienso Nag Champa', 'physical', (SELECT id FROM categories WHERE slug = 'inciensos'), 85.00, 30.00, 0.16, true, true),
('INC-002', 'Incienso Sándalo Premium', 'incienso-sandalo-premium', 'Caja de 15 barras de incienso de sándalo', 'physical', (SELECT id FROM categories WHERE slug = 'inciensos'), 120.00, 45.00, 0.16, true, true),
('COJ-001', 'Cojín Zafu Meditación', 'cojin-zafu-meditacion', 'Cojín zafu para meditación, relleno de kapok', 'physical', (SELECT id FROM categories WHERE slug = 'cojines'), 650.00, 280.00, 0.16, true, true),
('MAZ-001', 'Mazo de Fieltro Cuencos', 'mazo-fieltro-cuencos', 'Mazo con cabeza de fieltro para cuencos medianos y grandes', 'physical', (SELECT id FROM categories WHERE slug = 'mazos-baquetas'), 250.00, 80.00, 0.16, true, true),
('MAZ-002', 'Baqueta de Madera', 'baqueta-madera', 'Baqueta de madera para cuencos pequeños', 'physical', (SELECT id FROM categories WHERE slug = 'mazos-baquetas'), 150.00, 50.00, 0.16, true, true),
('DIG-001', 'Meditación Guiada MP3', 'meditacion-guiada-mp3', 'Audio de meditación guiada con cuencos, 30 minutos', 'digital', (SELECT id FROM categories WHERE slug = 'cursos'), 99.00, 10.00, 0.16, true, false);

-- =============================================================================
-- OPTION GROUPS
-- =============================================================================

INSERT INTO option_groups (name, sort_order) VALUES
('Tamaño', 1),
('Material', 2),
('Color', 3),
('Talla', 4);

-- =============================================================================
-- OPTION VALUES
-- =============================================================================

INSERT INTO option_values (group_id, value, sort_order) VALUES
((SELECT id FROM option_groups WHERE name = 'Tamaño'), 'Chico', 1),
((SELECT id FROM option_groups WHERE name = 'Tamaño'), 'Mediano', 2),
((SELECT id FROM option_groups WHERE name = 'Tamaño'), 'Grande', 3),
((SELECT id FROM option_groups WHERE name = 'Material'), 'Bronce', 1),
((SELECT id FROM option_groups WHERE name = 'Material'), 'Siete Metales', 2),
((SELECT id FROM option_groups WHERE name = 'Material'), 'Cobre', 3),
((SELECT id FROM option_groups WHERE name = 'Color'), 'Negro', 1),
((SELECT id FROM option_groups WHERE name = 'Color'), 'Azul', 2),
((SELECT id FROM option_groups WHERE name = 'Color'), 'Rojo', 3),
((SELECT id FROM option_groups WHERE name = 'Talla'), 'S', 1),
((SELECT id FROM option_groups WHERE name = 'Talla'), 'M', 2),
((SELECT id FROM option_groups WHERE name = 'Talla'), 'L', 3),
((SELECT id FROM option_groups WHERE name = 'Talla'), 'XL', 4);
