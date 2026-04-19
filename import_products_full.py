import openpyxl, subprocess, json, re, unicodedata

wb = openpyxl.load_workbook('inventarios2026.xlsx', data_only=True)

def parse_num(v):
    if not v: return 0
    s = str(v).replace('$', '').replace(' ', '').strip()
    if ',' in s and '.' not in s:
        s = s.replace(',', '.')
    elif ',' in s and '.' in s:
        s = s.replace(',', '')
    try: return float(s)
    except: return 0

def format_weight(peso_raw):
    """Format weight for product name"""
    if not peso_raw:
        return ''
    s = str(peso_raw).strip()
    val = parse_num(s)
    if val == 0:
        # Non-numeric weight like ".940 ML"
        return s
    # If value > 100, it was likely in grams (Excel comma issue), convert to kg
    if val > 100:
        val = val / 1000.0
    # Format nicely
    if val >= 1:
        return f'{val:.3f}kg'.rstrip('0').rstrip('.')  + 'kg' if not f'{val:.3f}'.rstrip('0').rstrip('.').endswith('kg') else f'{val:.3f}'.rstrip('0').rstrip('.') + 'kg'
    else:
        # Show in grams for small items
        grams = val * 1000
        if grams == int(grams):
            return f'{int(grams)}gr'
        return f'{val:.3f}kg'.rstrip('0').rstrip('.') + 'kg'

def clean_weight_str(val):
    v = parse_num(val)
    if v == 0:
        s = str(val).strip() if val else ''
        return s  # return raw for non-numeric like ".940 ML"
    if v > 100:
        v = v / 1000.0
    if v >= 1:
        formatted = f'{v:.3f}'.rstrip('0').rstrip('.')
        return f'{formatted}kg'
    else:
        grams = v * 1000
        if grams == int(grams):
            return f'{int(grams)}gr'
        formatted = f'{v:.3f}'.rstrip('0').rstrip('.')
        return f'{formatted}kg'

PDV_MAP = {
    'PAGINA WEB': 'Pagina Web',
    'PAG WEB': 'Pagina Web',
    'RENACER': 'El Renacer',
    'SOLAR': 'Solar',
    'FAM HOCH': None,  # Client, not almacen
}

# Category mapping
CATEGORY_MAP = {
    'POLLO': 'Pollo',
    'PECHUGA': 'Pollo',
    'PIERNA': 'Pollo',
    'MEDIO POLLO': 'Pollo',
    'MOLIDA DE POLLO': 'Pollo',
    'CERDO': 'Cerdo',
    'CABEZA DE LOMO': 'Cerdo',
    'CHULETA': 'Cerdo',
    'COSTILLA': 'Cerdo',
    'FILETE DE CERDO': 'Cerdo',
    'HIGADO DE CERDO': 'Cerdo',
    'LOMO DE CERDO': 'Cerdo',
    'LOMO AHUMADO': 'Cerdo',
    'MACIZA': 'Cerdo',
    'MANTECA': 'Cerdo',
    'MOLIDA DE CERDO': 'Cerdo',
    'PIERNA AHUMADA': 'Cerdo',
    'PORK BELLY': 'Cerdo',
    'TOCINO': 'Cerdo',
    'ROLLO DE TOCINO': 'Cerdo',
    'GORDITAS': 'Cerdo',
    'CHORIZO DE CERDO': 'Cerdo',
    'JERKY': 'Cerdo',
    'BORREGO': 'Borrego',
    'SALAMI': 'Charcuteria',
    'SALCHICHA': 'Borrego',
    'CALDO DE HUESO': 'Pollo',
    'CALDO DE HUESO DE BORREGO': 'Borrego',
    'ALIMENTO MASCOTA': 'Mascotas',
}

def get_category(name):
    name_upper = name.upper()
    for key, cat in CATEGORY_MAP.items():
        if key in name_upper:
            return cat
    return 'Otros'

def parse_inventory(ws, start_row=2):
    items = []
    for row in ws.iter_rows(min_row=start_row, values_only=True):
        vals = list(row[:6])
        inv, producto, peso, pub, prov, pdv = vals
        if not producto or str(producto).strip() in ('PRODUCTO', ''):
            continue
        p = str(producto).strip()
        # Normalize names
        p_upper = p.upper()
        if p_upper == 'PECHUGAS': p = 'PECHUGA'
        elif p_upper == 'MOILIDA DE BORREGO': p = 'MOLIDA DE BORREGO'
        elif p_upper == 'SALCHICHA DE CHULE MORITA': p = 'SALCHICHA DE CHILE MORITA'
        elif 'CALDO DE HUESO  DE BORREGO' in p_upper: p = 'CALDO DE HUESO DE BORREGO'
        elif p_upper == 'ALIMENTO MASCOTA COCIDO ': p = 'ALIMENTO MASCOTA COCIDO'
        elif p_upper == 'ALIMENTO MASCOTA CRUDO': p = 'ALIMENTO MASCOTA CRUDO'

        weight_str = clean_weight_str(peso)
        if weight_str:
            full_name = f'{p} {weight_str}'
        else:
            full_name = p

        pub_val = parse_num(pub)
        prov_val = parse_num(prov)

        pdv_name = str(pdv).strip().upper().replace('.', '').strip() if pdv else ''
        if pdv_name in ('PAG WEB', 'PAGINA WEB'): pdv_name = 'PAGINA WEB'
        if pdv_name in ('PUNTO DE VENTA', 'CLIENTE', ''): continue

        items.append({
            'name': full_name,
            'pub': pub_val,
            'prov': prov_val,
            'pdv': pdv_name,
            'category': get_category(p),
        })
    return items

pollos = parse_inventory(wb['Inventario pollos'])
cerdos = parse_inventory(wb['Inventario Cerdos'])
all_items = pollos + cerdos

# Group by product name: count per PDV = stock
products = {}
for item in all_items:
    name = item['name']
    if name not in products:
        products[name] = {'pdvs': {}, 'pub': 0, 'prov': 0, 'category': item['category']}
    pdv = item['pdv']
    if pdv not in products[name]['pdvs']:
        products[name]['pdvs'][pdv] = {'count': 0, 'pub': 0, 'prov': 0}
    products[name]['pdvs'][pdv]['count'] += 1
    if item['pub'] > 0:
        products[name]['pdvs'][pdv]['pub'] = item['pub']
        products[name]['pub'] = item['pub']
    if item['prov'] > 0:
        products[name]['pdvs'][pdv]['prov'] = item['prov']
        products[name]['prov'] = item['prov']

print(f'Total unique products: {len(products)}')

# Get almacen IDs
def run_sql(sql):
    r = subprocess.run(['ssh', 'easypanel-vps',
        f'docker exec main_supabase-daralimento-db-1 psql -U postgres -d postgres -t -A -c "{sql}"'],
        capture_output=True, text=True, timeout=15)
    return r.stdout.strip()

almacenes = {}
for line in run_sql("SELECT id, nombre FROM almacenes WHERE is_active = true").split('\n'):
    parts = line.split('|')
    if len(parts) >= 2:
        almacenes[parts[1].strip()] = parts[0].strip()

# Fix PDV_MAP with actual almacen name
web_id = None
for name, aid in almacenes.items():
    if 'web' in name.lower() or 'gina' in name.lower():
        web_id = aid
        PDV_MAP['PAGINA WEB'] = name
        PDV_MAP['PAG WEB'] = name
        break

# Get category IDs
categories = {}
for line in run_sql("SELECT id, name FROM categories WHERE is_active = true").split('\n'):
    parts = line.split('|')
    if len(parts) >= 2:
        categories[parts[1].strip()] = parts[0].strip()

print(f'Almacenes: {list(almacenes.keys())}')
print(f'Categories: {list(categories.keys())}')

# Generate SQL
sql = []
sql.append("BEGIN;")

# 1. Delete all existing products (cascades to variants, stock, prices, mappings)
sql.append("DELETE FROM product_wc_map;")
sql.append("DELETE FROM almacen_precios;")
sql.append("DELETE FROM almacen_stock;")
sql.append("DELETE FROM product_variants;")
sql.append("DELETE FROM products;")

# 2. Create products
sku_counter = 1
for name, info in sorted(products.items()):
    safe_name = name.replace("'", "''")
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    sku = f'DAR{sku_counter:04d}'
    sku_counter += 1

    cat_name = info['category']
    cat_id = categories.get(cat_name)
    cat_sql = f"'{cat_id}'" if cat_id else 'NULL'

    base_price = info['pub'] if info['pub'] > 0 else info['prov']
    precio_mayoreo = info['prov']

    sql.append(f"INSERT INTO products (name, slug, sku, base_price, precio_mayoreo, tax_rate, is_active, track_stock, product_type, category_id) VALUES ('{safe_name}', '{slug}', '{sku}', {base_price}, {precio_mayoreo}, 0, true, true, 'simple', {cat_sql});")

    # Create default variant
    sql.append(f"INSERT INTO product_variants (product_id, sku, stock, min_stock, is_active) SELECT id, '{sku}', 0, 0, true FROM products WHERE sku = '{sku}';")

    # Stock and prices per almacen
    for pdv, pdv_info in info['pdvs'].items():
        alm_name = PDV_MAP.get(pdv)
        if not alm_name:
            continue
        alm_id = almacenes.get(alm_name)
        if not alm_id:
            continue

        stock = pdv_info['count']
        pub = pdv_info['pub']
        prov = pdv_info['prov']

        # Stock
        sql.append(f"INSERT INTO almacen_stock (almacen_id, variant_id, stock) SELECT '{alm_id}', pv.id, {stock} FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE p.sku = '{sku}' ON CONFLICT (almacen_id, variant_id) DO UPDATE SET stock = {stock};")

        # Prices
        if pub > 0 or prov > 0:
            sql.append(f"INSERT INTO almacen_precios (almacen_id, product_id, precio_publico, precio_proveedores) SELECT '{alm_id}', id, {pub}, {prov} FROM products WHERE sku = '{sku}' ON CONFLICT (almacen_id, product_id) DO UPDATE SET precio_publico = CASE WHEN {pub} > 0 THEN {pub} ELSE almacen_precios.precio_publico END, precio_proveedores = CASE WHEN {prov} > 0 THEN {prov} ELSE almacen_precios.precio_proveedores END;")

    # Update total variant stock
    sql.append(f"UPDATE product_variants SET stock = COALESCE((SELECT sum(s.stock) FROM almacen_stock s WHERE s.variant_id = product_variants.id), 0) WHERE product_id = (SELECT id FROM products WHERE sku = '{sku}');")

sql.append("COMMIT;")

with open('import_full_products.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql))
print(f'\nSQL: {len(sql)} lines written')
