import subprocess, json, re, time

WC_URL = "https://daralimento.com"
WC_KEY = "ck_a1412e5e59584d454c9584c29915cc5046befeab"
WC_SECRET = "cs_65881d2e22fb1e162e8b8091f9b3d2f7a66fb01c"

def wc_get(path, params=""):
    url = f"{WC_URL}/wp-json/wc/v3{path}?consumer_key={WC_KEY}&consumer_secret={WC_SECRET}&{params}"
    r = subprocess.run(['curl', '-s', url], capture_output=True, text=True, timeout=30)
    return json.loads(r.stdout)

def wc_put(path, data):
    url = f"{WC_URL}/wp-json/wc/v3{path}?consumer_key={WC_KEY}&consumer_secret={WC_SECRET}"
    r = subprocess.run(['curl', '-s', '-X', 'PUT', url, '-H', 'Content-Type: application/json', '-d', json.dumps(data)],
        capture_output=True, text=True, timeout=30)
    return json.loads(r.stdout)

def wc_post(path, data):
    url = f"{WC_URL}/wp-json/wc/v3{path}?consumer_key={WC_KEY}&consumer_secret={WC_SECRET}"
    r = subprocess.run(['curl', '-s', '-X', 'POST', url, '-H', 'Content-Type: application/json', '-d', json.dumps(data)],
        capture_output=True, text=True, timeout=30)
    return json.loads(r.stdout)

def run_sql(sql):
    r = subprocess.run(['ssh', 'easypanel-vps',
        f'docker exec main_supabase-daralimento-db-1 psql -U postgres -d postgres -t -A -c "{sql}"'],
        capture_output=True, text=True, timeout=15)
    return r.stdout.strip()

# Get Pagina Web almacen ID
alm_web_id = run_sql("SELECT id FROM almacenes WHERE nombre LIKE '%gina Web%' LIMIT 1")
print(f"Almacen Pagina Web: {alm_web_id}")

# Get POS products with stock in Pagina Web
pos_products_raw = run_sql(f"""
SELECT p.id, p.name, p.base_price, pv.id as vid,
  COALESCE((SELECT stock FROM almacen_stock WHERE almacen_id = '{alm_web_id}' AND variant_id = pv.id), 0) as web_stock,
  COALESCE((SELECT precio_publico FROM almacen_precios WHERE almacen_id = '{alm_web_id}' AND product_id = p.id), p.base_price) as web_price
FROM products p
JOIN product_variants pv ON pv.product_id = p.id
WHERE p.is_active = true
ORDER BY p.name
""")

pos_products = []
for line in pos_products_raw.split('\n'):
    parts = line.split('|')
    if len(parts) >= 6:
        pos_products.append({
            'id': parts[0].strip(),
            'name': parts[1].strip(),
            'base_price': float(parts[2].strip() or 0),
            'vid': parts[3].strip(),
            'web_stock': int(float(parts[4].strip() or 0)),
            'web_price': float(parts[5].strip() or 0),
        })

print(f"POS products: {len(pos_products)}")

# Get current WC products
wc_products = wc_get('/products', 'per_page=100')
print(f"WC products: {len(wc_products)}")

# Build WC name -> WC product map
wc_map = {}
for wp in wc_products:
    wc_map[wp['name'].strip().upper()] = wp

# Match POS products to WC products
def normalize(s):
    s = s.upper().strip()
    s = re.sub(r'\s+', ' ', s)
    return s

updated = 0
created = 0
skipped = 0

for pp in pos_products:
    if pp['web_stock'] <= 0 and pp['web_price'] <= 0:
        skipped += 1
        continue

    pos_name = normalize(pp['name'])
    price = pp['web_price'] if pp['web_price'] > 0 else pp['base_price']
    stock = pp['web_stock']

    # Try to find matching WC product
    wc_prod = None
    # Exact match
    for wc_name, wp in wc_map.items():
        if normalize(wc_name) == pos_name:
            wc_prod = wp
            break

    if not wc_prod:
        # Fuzzy: POS name contains WC name or vice versa
        for wc_name, wp in wc_map.items():
            wn = normalize(wc_name)
            # Remove "POLLO - " prefix for matching
            wn_clean = re.sub(r'^(POLLO|CERDO|BORREGO)\s*-?\s*', '', wn).strip()
            pn_clean = re.sub(r'^(POLLO|CERDO|BORREGO)\s*-?\s*', '', pos_name).strip()
            if wn_clean == pn_clean or wn in pos_name or pos_name in wn:
                wc_prod = wp
                break

    if wc_prod:
        # Update existing WC product
        update_data = {
            'regular_price': str(price),
            'stock_quantity': stock,
            'manage_stock': True,
        }
        result = wc_put(f'/products/{wc_prod["id"]}', update_data)
        if 'id' in result:
            print(f"  UPDATED WC:{wc_prod['id']} '{wc_prod['name']}' -> price={price}, stock={stock}")
            updated += 1

            # Save WC mapping
            run_sql(f"INSERT INTO product_wc_map (product_id, wc_product_id, wc_product_name) VALUES ('{pp['id']}', {wc_prod['id']}, '{wc_prod['name'].replace(chr(39), chr(39)+chr(39))}') ON CONFLICT (wc_product_id) DO UPDATE SET product_id = EXCLUDED.product_id")
        else:
            print(f"  ERROR updating WC:{wc_prod['id']}: {result.get('message', 'unknown')}")
    elif stock > 0:
        # Create new WC product
        create_data = {
            'name': pp['name'],
            'regular_price': str(price),
            'stock_quantity': stock,
            'manage_stock': True,
            'status': 'publish',
        }
        result = wc_post('/products', create_data)
        if 'id' in result:
            print(f"  CREATED WC:{result['id']} '{pp['name']}' price={price} stock={stock}")
            created += 1
            run_sql(f"INSERT INTO product_wc_map (product_id, wc_product_id, wc_product_name) VALUES ('{pp['id']}', {result['id']}, '{pp['name'].replace(chr(39), chr(39)+chr(39))}') ON CONFLICT (wc_product_id) DO NOTHING")
        else:
            print(f"  ERROR creating '{pp['name']}': {result.get('message', 'unknown')}")
    else:
        skipped += 1

print(f"\nDone: {updated} updated, {created} created, {skipped} skipped")
