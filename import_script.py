import openpyxl, subprocess, json

wb = openpyxl.load_workbook('inventarios2026.xlsx', data_only=True)

# Get POS data from DB
def run_sql(sql):
    r = subprocess.run(['ssh', 'easypanel-vps',
        f'docker exec main_supabase-daralimento-db-1 psql -U postgres -d postgres -t -A -c "{sql}"'],
        capture_output=True, text=True, timeout=15)
    return r.stdout.strip()

pos_products = {}
for line in run_sql("SELECT id, upper(name) FROM products WHERE is_active = true").split('\n'):
    parts = line.split('|')
    if len(parts) >= 2:
        pos_products[parts[1].strip()] = parts[0].strip()

almacenes = {}
for line in run_sql("SELECT id, nombre FROM almacenes WHERE is_active = true").split('\n'):
    parts = line.split('|')
    if len(parts) >= 2:
        almacenes[parts[1].strip()] = parts[0].strip()

variants = {}
for line in run_sql("SELECT product_id, id FROM product_variants WHERE is_active = true ORDER BY created_at").split('\n'):
    parts = line.split('|')
    if len(parts) >= 2:
        pid = parts[0].strip()
        if pid not in variants:
            variants[pid] = parts[1].strip()

print(f'POS products: {len(pos_products)}, Almacenes: {list(almacenes.keys())}, Variants: {len(variants)}')

PRODUCT_MAP = {
    'POLLO ENTERO': 'POLLO ENTERO',
    'POLLO PARTIDO': 'POLLO - PARTIDO',
    'MEDIO POLLO': 'POLLO - MEDIO POLLO',
    'PECHUGA': 'POLLO - PECHUGA',
    'PIERNA Y MUSLO': 'POLLO - PIERNA Y MUSLO',
    'MOLIDA DE POLLO': 'POLLO - MOLIDA',
    'ALIMENTO MASCOTA COCIDO': 'ALIMENTO PARA MASCOTA COCIDO',
    'ALIMENTO MASCOTA CRUDO': 'ALIMENTO PARA MASCOTA CRUDO',
    'BRAZO DE BORREGO': 'BORREGO - CARNE BROCHETA',
    'CABEZA DE LOMO': 'CERDO - CABEZA DE LOMO',
    'CABEZA DE LOMO BORREGO': 'BORREGO - CABEZA DE LOMO',
    'CALDO DE HUESO': 'POLLO - CALDO HUESO',
    'CALDO DE HUESO DE BORREGO': 'BORREGO - CALDO DE HUESO',
    'CHORIZO DE CERDO': 'CERDO - CHORIZO',
    'CHULETA': 'CERDO - CHULETA',
    'COSTILLA': 'CERDO - COSTILLA',
    'COSTILLA DE BORREGO': 'BORREGO - COSTILLAS',
    'FILETE DE BORREGO': 'BORREGO - FILETE',
    'FILETE DE CERDO': 'CERDO - FILETE',
    'GORDITAS DE CHICHARRON': 'CERDO - GORDITAS DE CHICHARR\u00d3N 4PZ',
    'HIGADO DE CERDO': 'CERDO - HIGADO',
    'JERKY CERDO': 'CERDO- JERKY',
    'LOMO AHUMADO': 'CERDO- LOMO AHUMADO',
    'LOMO DE BORREGO': 'BORREGO - LOMO',
    'LOMO DE CERDO': 'CERDO - LOMO',
    'MACIZA DE CERDO': 'CERDO - MACIZA',
    'MANTECA 1 LT': 'MANTECA 1/',
    'MANTECA DE CERDO .500 GR': 'CERDO- MANTECA',
    'MOLIDA DE BORREGO': 'BORREGO - MOLIDA',
    'MOLIDA DE CERDO': 'CERDO -CARNE MOLIDA',
    'PIERNA AHUMADA': 'CERDO - PIERNA AHUMADA',
    'PORK BELLY': 'PORK BELLY',
    'ROLLO AHUMADO DE BORREGO': 'BORREGO - ROLL\u00d3 AHUMADO',
    'ROLLO DE TOCINO': 'CERDO- ROLLO DE TOCINO',
    'SALAMI ARGENTINO': 'SALAMI ARGENTINO (150 - )',
    'SALAMI DE BORREGO': 'SALAMI BORREGO (100 - )',
    'SALAMI ITALIANO': 'SALAMI ITALIANO AHUMADO (100 - )',
    'SALCHICHA CHIPOTLE BORREGO': 'BORREGO - SALCHICHA CHIPOTLE',
    'SALCHICHA DE CHILE MORITA': 'BORREGO - SALCHICHA CHILE MORITA',
    'SALCHICHA DE GUAJILLO BORREGO': 'BORREGO - SALCHICHA GUAJILLO',
    'TOCINO REBANADO': 'CERDO- TOCINO REBANADO',
}

# Map PDV names from Excel to almacen names in DB
pdv_web_name = None
for name in almacenes:
    if 'gina' in name.lower() or 'web' in name.lower():
        pdv_web_name = name
        break

PDV_MAP = {
    'PAGINA WEB': pdv_web_name,
    'PAG WEB': pdv_web_name,
    'PAG. WEB': pdv_web_name,
    'RENACER': 'El Renacer',
    'SOLAR': 'Solar',
}

def parse_num(v):
    if not v: return 0
    s = str(v).replace('$', '').replace(' ', '')
    if ',' in s and '.' not in s:
        s = s.replace(',', '.')
    elif ',' in s and '.' in s:
        s = s.replace(',', '')
    try: return float(s)
    except: return 0

def parse_inventory(ws, start_row=2):
    items = []
    for row in ws.iter_rows(min_row=start_row, values_only=True):
        vals = list(row[:6])
        inv, producto, peso, pub, prov, pdv = vals
        if not producto or str(producto).strip() in ('PRODUCTO', ''):
            continue
        p = str(producto).strip().upper()
        if p == 'PECHUGAS': p = 'PECHUGA'
        if p == 'MOILIDA DE BORREGO': p = 'MOLIDA DE BORREGO'
        if p == 'SALCHICHA DE CHULE MORITA': p = 'SALCHICHA DE CHILE MORITA'
        if 'CALDO DE HUESO  DE BORREGO' in p: p = 'CALDO DE HUESO DE BORREGO'

        pdv_name = str(pdv).strip().upper().replace('.', '').strip() if pdv else ''
        if pdv_name in ('PAG WEB', 'PAGINA WEB'): pdv_name = 'PAGINA WEB'
        if pdv_name in ('PUNTO DE VENTA', 'CLIENTE', ''): continue

        items.append({
            'producto': p,
            'inv': int(parse_num(inv)) if inv else 0,
            'pub': parse_num(pub),
            'prov': parse_num(prov),
            'pdv': pdv_name
        })
    return items

pollos = parse_inventory(wb['Inventario pollos'])
cerdos = parse_inventory(wb['Inventario Cerdos'])
all_items = pollos + cerdos

# Group by product + PDV
grouped = {}
for item in all_items:
    key = (item['producto'], item['pdv'])
    if key not in grouped:
        grouped[key] = {'inv': 0, 'pubs': [], 'provs': []}
    if item['pub'] > 0: grouped[key]['pubs'].append(item['pub'])
    if item['prov'] > 0: grouped[key]['provs'].append(item['prov'])
    if item['inv'] > 0: grouped[key]['inv'] = item['inv']

# Generate SQL
sql = ["BEGIN;"]
matched = 0
unmatched = []

for (prod, pdv), info in sorted(grouped.items()):
    pos_name = PRODUCT_MAP.get(prod, prod).upper()
    product_id = pos_products.get(pos_name)

    if not product_id:
        # Try partial match ignoring accents
        import unicodedata
        def strip_accents(s):
            return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
        prod_clean = strip_accents(pos_name)
        for pn, pid in pos_products.items():
            pn_clean = strip_accents(pn)
            if prod_clean in pn_clean or pn_clean in prod_clean:
                product_id = pid
                break
        if not product_id:
            # Try keyword match
            keywords = prod.split()
            for pn, pid in pos_products.items():
                pn_clean = strip_accents(pn)
                if all(strip_accents(kw) in pn_clean for kw in keywords if len(kw) > 2):
                    product_id = pid
                    break

    if not product_id:
        unmatched.append(f'{prod} -> {pos_name} NOT_FOUND')
        continue

    variant_id = variants.get(product_id)
    if not variant_id:
        unmatched.append(f'{prod} NO_VARIANT')
        continue

    almacen_name = PDV_MAP.get(pdv)
    if not almacen_name:
        continue
    almacen_id = almacenes.get(almacen_name)
    if not almacen_id:
        unmatched.append(f'{prod} @ {pdv} -> {almacen_name} ALM_NOT_FOUND')
        continue

    avg_pub = round(sum(info['pubs'])/len(info['pubs']), 2) if info['pubs'] else 0
    avg_prov = round(sum(info['provs'])/len(info['provs']), 2) if info['provs'] else 0
    stock = info['inv']

    sql.append(f"INSERT INTO almacen_stock (almacen_id, variant_id, stock) VALUES ('{almacen_id}', '{variant_id}', {stock}) ON CONFLICT (almacen_id, variant_id) DO UPDATE SET stock = {stock};")

    if avg_pub > 0 or avg_prov > 0:
        sql.append(f"INSERT INTO almacen_precios (almacen_id, product_id, precio_publico, precio_proveedores) VALUES ('{almacen_id}', '{product_id}', {avg_pub}, {avg_prov}) ON CONFLICT (almacen_id, product_id) DO UPDATE SET precio_publico = CASE WHEN {avg_pub} > 0 THEN {avg_pub} ELSE almacen_precios.precio_publico END, precio_proveedores = CASE WHEN {avg_prov} > 0 THEN {avg_prov} ELSE almacen_precios.precio_proveedores END;")

    matched += 1

sql.append("COMMIT;")

print(f'\nMatched: {matched}, Unmatched: {len(unmatched)}')
for u in unmatched:
    print(f'  ! {u}')

with open('import_inventory.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql))
print(f'SQL: {len(sql)} lines written to import_inventory.sql')
