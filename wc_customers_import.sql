DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 30) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'anakarla.enriquez@gmail.com' AND 'anakarla.enriquez@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Ana Karla Enriquez Reyes', NULLIF('anakarla.enriquez@gmail.com',''), NULLIF('5538998191','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 30, 'Ana Karla Enriquez Reyes', NULLIF('anakarla.enriquez@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 57) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'anapaulacasaresg@gmail.com' AND 'anapaulacasaresg@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Ana Paula Casares Gutierrez', NULLIF('anapaulacasaresg@gmail.com',''), NULLIF('5511714827','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 57, 'Ana Paula Casares Gutierrez', NULLIF('anapaulacasaresg@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 24) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'anafurrutia@gmail.com' AND 'anafurrutia@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('ana urrutia', NULLIF('anafurrutia@gmail.com',''), NULLIF('5545564742','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 24, 'ana urrutia', NULLIF('anafurrutia@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 17) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'amamolleda@gmail.com' AND 'amamolleda@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Andres Molleda Amozurrutia', NULLIF('amamolleda@gmail.com',''), NULLIF('+525519655089','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 17, 'Andres Molleda Amozurrutia', NULLIF('amamolleda@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 12) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'annabelmj73@gmail.com' AND 'annabelmj73@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Annabel Membrillo', NULLIF('annabelmj73@gmail.com',''), NULLIF('4422379140','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 12, 'Annabel Membrillo', NULLIF('annabelmj73@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 11) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'arturoezquerro@gmail.com' AND 'arturoezquerro@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Arturo Ezquerro', NULLIF('arturoezquerro@gmail.com',''), NULLIF('5554021609','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 11, 'Arturo Ezquerro', NULLIF('arturoezquerro@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 35) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'kar_nin@yahoo.com.mx' AND 'kar_nin@yahoo.com.mx' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Carlos Kaim', NULLIF('kar_nin@yahoo.com.mx',''), NULLIF('5551027676','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 35, 'Carlos Kaim', NULLIF('kar_nin@yahoo.com.mx',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 39) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'sanarte.acupuntura@gmail.com' AND 'sanarte.acupuntura@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Dalia Perez', NULLIF('sanarte.acupuntura@gmail.com',''), NULLIF('7222452628','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 39, 'Dalia Perez', NULLIF('sanarte.acupuntura@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 32) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'ega.adg@gmail.com' AND 'ega.adg@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Eduardo Graf Aparicio', NULLIF('ega.adg@gmail.com',''), NULLIF('5547401924','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 32, 'Eduardo Graf Aparicio', NULLIF('ega.adg@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 6) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'eduardo.mazaruiz@gmail.com' AND 'eduardo.mazaruiz@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Eduardo Maza', NULLIF('eduardo.mazaruiz@gmail.com',''), NULLIF('5540983488','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 6, 'Eduardo Maza', NULLIF('eduardo.mazaruiz@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 8) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'eliza_glez@yahoo.com' AND 'eliza_glez@yahoo.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Elizabeth Gonzalez', NULLIF('eliza_glez@yahoo.com',''), NULLIF('5521294294','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 8, 'Elizabeth Gonzalez', NULLIF('eliza_glez@yahoo.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 36) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'lizravelo80@gmail.com' AND 'lizravelo80@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('ELIZABETH RAVELO', NULLIF('lizravelo80@gmail.com',''), NULLIF('5635672500','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 36, 'ELIZABETH RAVELO', NULLIF('lizravelo80@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 26) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'eunice.velizc@gmail.com' AND 'eunice.velizc@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Eunice Veliz', NULLIF('eunice.velizc@gmail.com',''), NULLIF('5561118869','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 26, 'Eunice Veliz', NULLIF('eunice.velizc@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 49) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'ferpimross@gmail.com' AND 'ferpimross@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Fernanda Pimentel', NULLIF('ferpimross@gmail.com',''), NULLIF('7223725143','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 49, 'Fernanda Pimentel', NULLIF('ferpimross@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 18) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'fiorenzacp@gmail.com' AND 'fiorenzacp@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Fiorenza Cordero peralta', NULLIF('fiorenzacp@gmail.com',''), NULLIF('5541862943','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 18, 'Fiorenza Cordero peralta', NULLIF('fiorenzacp@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 38) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'tlayudadivina@gmail.com' AND 'tlayudadivina@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Haniel Gibson Medina', NULLIF('tlayudadivina@gmail.com',''), NULLIF('2201229480','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 38, 'Haniel Gibson Medina', NULLIF('tlayudadivina@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 42) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'esparzajan@gmail.com' AND 'esparzajan@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Jan Esparza', NULLIF('esparzajan@gmail.com',''), NULLIF('5539276771','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 42, 'Jan Esparza', NULLIF('esparzajan@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 13) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'johannes.coco@gmail.com' AND 'johannes.coco@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Johannes Wirnsberger', NULLIF('johannes.coco@gmail.com',''), NULLIF('5528823882','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 13, 'Johannes Wirnsberger', NULLIF('johannes.coco@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 3) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'dayiwiy906@eqvox.com' AND 'dayiwiy906@eqvox.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Josue Mazatzin Orihuela', NULLIF('dayiwiy906@eqvox.com',''), NULLIF('55585927781','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 3, 'Josue Mazatzin Orihuela', NULLIF('dayiwiy906@eqvox.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 2) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'josuemazatzin@gmail.com' AND 'josuemazatzin@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Josue Mazatzin Orihuela', NULLIF('josuemazatzin@gmail.com',''), NULLIF('5585927781','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 2, 'Josue Mazatzin Orihuela', NULLIF('josuemazatzin@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 46) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'hola@pulsocreativo.art' AND 'hola@pulsocreativo.art' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Josue Mazatzin Orihuela', NULLIF('hola@pulsocreativo.art',''), NULLIF('5585927781','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 46, 'Josue Mazatzin Orihuela', NULLIF('hola@pulsocreativo.art',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 16) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'jhonyguty@hotmail.com' AND 'jhonyguty@hotmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('juan carlos Garcia gutierrez', NULLIF('jhonyguty@hotmail.com',''), NULLIF('+525655702850','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 16, 'juan carlos Garcia gutierrez', NULLIF('jhonyguty@hotmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 9) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'jcgabogado9@gmail.com' AND 'jcgabogado9@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Juan Carlos Garcia Gutierrez', NULLIF('jcgabogado9@gmail.com',''), NULLIF('+525541803214','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 9, 'Juan Carlos Garcia Gutierrez', NULLIF('jcgabogado9@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 23) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'karicolor@yahoo.com' AND 'karicolor@yahoo.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Karina Bonnave', NULLIF('karicolor@yahoo.com',''), NULLIF('7221863114','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 23, 'Karina Bonnave', NULLIF('karicolor@yahoo.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 34) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'kdzipo@hotmail.com' AND 'kdzipo@hotmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Katja Trautwein', NULLIF('kdzipo@hotmail.com',''), NULLIF('9581079260','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 34, 'Katja Trautwein', NULLIF('kdzipo@hotmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 33) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'lorenaescuderop@gmail.com' AND 'lorenaescuderop@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('LORENA ESCUDERO', NULLIF('lorenaescuderop@gmail.com',''), NULLIF('+525529006641','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 33, 'LORENA ESCUDERO', NULLIF('lorenaescuderop@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 25) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'mardemoka@gmail.com' AND 'mardemoka@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Mar Segura', NULLIF('mardemoka@gmail.com',''), NULLIF('9841205047','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 25, 'Mar Segura', NULLIF('mardemoka@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 10) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'mmarti21@gmail.com' AND 'mmarti21@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Margarita Martinez', NULLIF('mmarti21@gmail.com',''), NULLIF('+527224050350','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 10, 'Margarita Martinez', NULLIF('mmarti21@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 29) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'maria.nacawe@gmail.com' AND 'maria.nacawe@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Maria Cacho', NULLIF('maria.nacawe@gmail.com',''), NULLIF('5543572440','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 29, 'Maria Cacho', NULLIF('maria.nacawe@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 31) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'maria.dlmr9@gmail.com' AND 'maria.dlmr9@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Maria De la Mora', NULLIF('maria.dlmr9@gmail.com',''), NULLIF('7226153238','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 31, 'Maria De la Mora', NULLIF('maria.dlmr9@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 47) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'moralesf718@gmail.com' AND 'moralesf718@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Maria Elena Morales Fuentes', NULLIF('moralesf718@gmail.com',''), NULLIF('7221569568','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 47, 'Maria Elena Morales Fuentes', NULLIF('moralesf718@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 37) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'martinangelaccio@gmail.com' AND 'martinangelaccio@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Martin Angelaccio', NULLIF('martinangelaccio@gmail.com',''), NULLIF('9982381640','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 37, 'Martin Angelaccio', NULLIF('martinangelaccio@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 28) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'matteojs97@gmail.com' AND 'matteojs97@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Matteo Schlitz', NULLIF('matteojs97@gmail.com',''), NULLIF('+12025706056','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 28, 'Matteo Schlitz', NULLIF('matteojs97@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 14) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'maugrutter@gmail.com' AND 'maugrutter@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Mau Grutter', NULLIF('maugrutter@gmail.com',''), NULLIF('5554378104','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 14, 'Mau Grutter', NULLIF('maugrutter@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 27) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'meghanmonsour@gmail.com' AND 'meghanmonsour@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Meghan Monsour', NULLIF('meghanmonsour@gmail.com',''), NULLIF('5532452281','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 27, 'Meghan Monsour', NULLIF('meghanmonsour@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 20) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'nirmal.khalsa@gmail.com' AND 'nirmal.khalsa@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Nirmal Khalsa Gaytan', NULLIF('nirmal.khalsa@gmail.com',''), NULLIF('+525618537930','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 20, 'Nirmal Khalsa Gaytan', NULLIF('nirmal.khalsa@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 22) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'olgamgraf@gmail.com' AND 'olgamgraf@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Olga Graf', NULLIF('olgamgraf@gmail.com',''), NULLIF('5542224976','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 22, 'Olga Graf', NULLIF('olgamgraf@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 5) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'info@disenoambientalregenerativo.com' AND 'info@disenoambientalregenerativo.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Phil Hoch', NULLIF('info@disenoambientalregenerativo.com',''), NULLIF('7225710467','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 5, 'Phil Hoch', NULLIF('info@disenoambientalregenerativo.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 43) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'soyrosagante@gmail.com' AND 'soyrosagante@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Rosa Adame', NULLIF('soyrosagante@gmail.com',''), NULLIF('5535660744','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 43, 'Rosa Adame', NULLIF('soyrosagante@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 40) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'sebastapiaescobar@gmail.com' AND 'sebastapiaescobar@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Sebastian Tapia Escobar', NULLIF('sebastapiaescobar@gmail.com',''), NULLIF('5585311670','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 40, 'Sebastian Tapia Escobar', NULLIF('sebastapiaescobar@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 15) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'stefanonicettoterres@gmail.com' AND 'stefanonicettoterres@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Stefano Nicetto', NULLIF('stefanonicettoterres@gmail.com',''), NULLIF('7773035658','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 15, 'Stefano Nicetto', NULLIF('stefanonicettoterres@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 21) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'oleundsu@gmail.com' AND 'oleundsu@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Susana Sevilla', NULLIF('oleundsu@gmail.com',''), NULLIF('5568998202','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 21, 'Susana Sevilla', NULLIF('oleundsu@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 19) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'suzolea@gmail.com' AND 'suzolea@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Suzette Olea', NULLIF('suzolea@gmail.com',''), NULLIF('5550685055','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 19, 'Suzette Olea', NULLIF('suzolea@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 41) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'valentina.abalzati@gmail.com' AND 'valentina.abalzati@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Valentina Abalzati', NULLIF('valentina.abalzati@gmail.com',''), NULLIF('15534176000','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 41, 'Valentina Abalzati', NULLIF('valentina.abalzati@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 55) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'cosecha@daralimento.com' AND 'cosecha@daralimento.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Ventas La Cosecha', NULLIF('cosecha@daralimento.com',''), NULLIF('','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 55, 'Ventas La Cosecha', NULLIF('cosecha@daralimento.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 56) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'jornada@daralimento.com' AND 'jornada@daralimento.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Ventas La Jornada CDMX', NULLIF('jornada@daralimento.com',''), NULLIF('','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 56, 'Ventas La Jornada CDMX', NULLIF('jornada@daralimento.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 53) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'pizca@daralimento.com' AND 'pizca@daralimento.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Ventas La Pizca', NULLIF('pizca@daralimento.com',''), NULLIF('','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 53, 'Ventas La Pizca', NULLIF('pizca@daralimento.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 51) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'mostrador@daralimento.com' AND 'mostrador@daralimento.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Ventas Mostrador', NULLIF('mostrador@daralimento.com',''), NULLIF('','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 51, 'Ventas Mostrador', NULLIF('mostrador@daralimento.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 52) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'renacer@daraliomento.com' AND 'renacer@daraliomento.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Ventas Renacer', NULLIF('renacer@daraliomento.com',''), NULLIF('','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 52, 'Ventas Renacer', NULLIF('renacer@daraliomento.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
DO $$
DECLARE v_cid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_wc_map WHERE wc_customer_id = 4) THEN
    SELECT id INTO v_cid FROM clientes WHERE email = 'uani1320@gmail.com' AND 'uani1320@gmail.com' != '' LIMIT 1;
    IF v_cid IS NULL THEN
      INSERT INTO clientes (nombre, email, telefono) VALUES ('Yumi Ueda Higareda', NULLIF('uani1320@gmail.com',''), NULLIF('5522542306','')) RETURNING id INTO v_cid;
    END IF;
    IF v_cid IS NOT NULL THEN
      INSERT INTO client_wc_map (cliente_id, wc_customer_id, wc_customer_name, wc_customer_email)
      VALUES (v_cid, 4, 'Yumi Ueda Higareda', NULLIF('uani1320@gmail.com',''))
      ON CONFLICT (wc_customer_id) DO NOTHING;
    END IF;
  END IF;
END $$;
