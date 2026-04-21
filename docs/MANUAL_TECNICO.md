# POS DAR Alimento — Manual Tecnico

> Actualizado: 2026-04-21
> Stack: React 19 + TypeScript + Vite + Supabase + Vercel + TanStack Query

---

## 1. Arquitectura General

```
pos-daralimento/
├── api/                    # Vercel Serverless Functions
│   ├── wc-proxy.ts         # Proxy a WooCommerce REST API
│   ├── wc-webhook.ts       # Webhook receptor de ordenes WooCommerce
│   └── whatsapp.ts         # Proxy a Green API (WhatsApp)
├── src/
│   ├── features/           # Modulos funcionales
│   │   ├── pos/            # Punto de venta (ventas)
│   │   ├── catalog/        # Productos, categorias
│   │   ├── almacenes/      # Puntos de venta / almacenes
│   │   ├── inventory/      # Inventario / Kardex
│   │   ├── notas/          # Notas de venta
│   │   ├── etiquetas/      # Etiquetas QR para Cricut
│   │   ├── whatsapp/       # Notificaciones WhatsApp
│   │   ├── reports/        # Reportes avanzados
│   │   ├── settings/       # Configuracion del negocio + depuracion
│   │   ├── auth/           # Autenticacion
│   │   ├── cajas/          # Cajas registradoras
│   │   ├── logs/           # Logs de auditoria
│   │   └── ...
│   ├── pages/              # Paginas (rutas)
│   ├── components/         # Componentes compartidos (UI, layouts)
│   └── integrations/       # Supabase client + tipos
├── supabase/migrations/    # Migraciones SQL
└── docs/                   # Documentacion
```

---

## 2. Sistema de Precios

### Regla fundamental
> Los precios SIEMPRE vienen de `almacen_precios`, NUNCA de `products.base_price`.

| Tabla | Uso |
|-------|-----|
| `products.base_price` | Legacy, NO se usa como precio real |
| `products.precio_mayoreo` | Legacy, NO se usa como precio real |
| `almacen_precios.precio_publico` | Precio publico por punto de venta |
| `almacen_precios.precio_proveedores` | Precio proveedor por punto de venta |

### Vinculacion producto ↔ punto de venta
Un producto esta vinculado a un punto de venta si tiene `precio_publico > 0` O `precio_proveedores > 0` en `almacen_precios` para ese almacen.

### Flujo en el POS
```
usePosProducts() → fetch productos
  → useAlmacenPriceMap(almacenId) → fetch almacen_precios
    → applyAlmacenPrices(products, priceMap) → sobreescribe precios
      → ProductGrid muestra precios del almacen seleccionado
```

**Archivo clave:** `src/features/pos/hooks/usePosProducts.ts`

---

## 3. Sincronizacion WooCommerce

### Arquitectura
```
POS ←→ wc-proxy.ts ←→ WooCommerce REST API
        (server-side credentials)

WooCommerce → wc-webhook.ts → POS (ordenes entrantes)
```

### Credenciales (Vercel env vars)
- `WC_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`

### Tabla de mapeo
`product_wc_map`: vincula `product_id` (POS) ↔ `wc_product_id` (WC)

### Sync individual (`syncProductToWC.ts`)
- Boton en ficha de producto + boton en lista de productos (columna WC)
- **Guard clause**: productos desactivados (`is_active=false`) se rechazan inmediatamente
- Si no existe en WC: POST → crea + guarda mapping
- Si existe: PUT → actualiza nombre, precio, stock, imagen, peso
- Si fue borrado de WC (404): force-delete del anterior, purga trash por SKU, re-crea
- **Purga de trash**: antes de crear, busca productos en WC trash con mismo SKU y los elimina permanentemente (evita error `product_invalid_sku`)
- Siempre `status: 'publish'` (nunca draft para productos activos)
- Datos sincronizados: name, sku, regular_price, stock_quantity, stock_status, weight, image, status, manage_stock, description

### Sync masivo (AlmacenesPage)
- Boton en tarjeta "Pagina Web" → sincroniza TODOS los productos **activos** vinculados
- Filtra por `almacen_precios.precio_publico > 0` AND `products.is_active = true`
- Progreso visible: "Sincronizando 15/172..."

### Sync stock automatico (`syncStockToWC.ts`)
- Se dispara al ajustar stock del almacen "Pagina Web"
- Desde: ajustes manuales, transferencias, editor de producto
- Fire-and-forget, no bloquea la UI

### Webhook entrante (`wc-webhook.ts`)
- Recibe ordenes completadas/procesadas de WooCommerce
- Reduce stock en almacen "Pagina Web"
- Crea registros en kardex, vtatkt, notas
- Auto-crea clientes desde datos WC

---

## 4. Notificaciones WhatsApp

### Arquitectura
```
POS → api/whatsapp.ts (proxy) → Green API → WhatsApp
      (credentials server-side)
```

### Credenciales (Vercel env vars)
- `GREEN_API_URL`, `GREEN_API_INSTANCE`, `GREEN_API_TOKEN`

### Configuracion (`whatsapp_config` table)
| Campo | Descripcion |
|-------|-------------|
| `enabled` | Activar notificaciones automaticas |
| `chat_type` | `none`, `number`, `group` |
| `chat_id` | Destino (ej: `5215512345678@c.us` o `120363XXX@g.us`) |

### Flujo automatico
```
useSale → createSale → nota creada
  → SOLO si entregado=true:
    → sendWhatsAppSaleNotification() [fire-and-forget]
      → consulta whatsapp_config.enabled
      → si activo: envia texto con desglose + link entrega
```
> Si el pedido no fue entregado (toggle "No, pendiente" en PaymentDialog), NO se envia WhatsApp.

### Flujo manual
- Boton WhatsApp (icono oficial verde) en listado de notas
- Envia texto con desglose de productos + link de confirmacion

### Archivos
- `api/whatsapp.ts` — proxy serverless (sendMessage, sendFileByUrl, getChats)
- `src/features/whatsapp/sendWhatsApp.ts` — utils cliente
- `src/features/whatsapp/WhatsAppSettings.tsx` — UI configuracion + prueba
- `src/features/whatsapp/renderTicketImage.ts` — generador de imagen (no usado actualmente)

---

## 5. Sistema de Entregas

### Flujo
1. Venta creada → `entrega_status: 'sin_entregar'` + `entrega_token` (UUID)
2. URL publica: `/entrega/:token` → muestra ticket + QR + boton confirmar
3. Cualquier persona con el link puede confirmar (RLS anonimo)
4. Al confirmar: `entrega_status: 'entregado'` + `entregado_at`

### Archivos
- `src/pages/EntregaPage.tsx` — pagina publica
- `src/features/notas/hooks/useNotas.ts` — `useConfirmDelivery`, `useToggleEntregaStatus`

---

## 6. Sistema de Pagos

### Flujo en POS
```
PaymentDialog → toggle "¿Se entrega ahora?" → createSale (useSale.ts)
  → Si pago completo: nota con pago_status='pagado', pagado=total
    + registro en nota_pagos
  → Si CxC: nota con pago_status='pendiente', pagado=0
  → Si split payment: multiples registros en nota_pagos
  → Si entregado=true: entrega_status='entregado' + entregado_at + WhatsApp
  → Si entregado=false: entrega_status='sin_entregar' + NO WhatsApp
```

### Toggle de entrega
- Antes de confirmar pago, el usuario elige: **"Si, entregado"** (default) o **"No, pendiente"**
- Si no se entrega, NO se envia notificacion WhatsApp automatica
- Aplica a todos los flujos: pago completo, dividido, CxC
- **Archivo:** `src/features/pos/components/PaymentDialog.tsx`

### Pago posterior (desde Notas)
- Boton "Pagar" → `useRegistrarPago` → inserta en `nota_pagos` + actualiza `pagado`

---

## 7. Cuentas por Cobrar (CxC)

### Vista principal (`CxCList.tsx`)
- Tarjetas resumen: Total por Cobrar, Clientes con Saldo, Notas Pendientes
- Agrupadas por cliente, ordenadas por saldo descendente
- Cada nota muestra folio, fecha, total, pagado, saldo + boton "Pagar"

### Detalle expandido de nota
Al hacer click en una nota se muestran 3 secciones:
1. **Articulos**: tabla con producto, cantidad, precio, descuento y subtotal
2. **Resumen**: barra visual con Total / Pagado / Resta
3. **Pagos registrados**: historial de abonos con fecha, metodo y monto

### Formula de subtotal
`subtotal = (precio - descuento_por_unidad) * cantidad`
> `descue` en `vtatkt` es descuento POR UNIDAD, no total de linea.

### Archivos
- `src/features/cxc/components/CxCList.tsx`
- `src/features/notas/hooks/useNotas.ts` (useNotaItems, useNotaPagos, useRegistrarPago)

---

## 8. Inventario y Kardex

### Tablas
| Tabla | Uso |
|-------|-----|
| `almacen_stock` | Stock por almacen + variante |
| `kardex` | Trazabilidad de movimientos |
| `product_variants` | Stock total (suma de todos los almacenes) |

### Descuento de stock al vender (`useSale`)
1. Valida existencia en `product_variants.stock`
2. Decrementa `product_variants.stock` (global)
3. Si hay `almacenId`: decrementa `almacen_stock` del almacen seleccionado
4. Crea entrada en `kardex` tipo `'venta'` (referencia al folio, vendedor, stock anterior/nuevo)
5. Invalida caches: `almacen-stock`, `product-almacen-stock`, `product-stock`, `pos-almacen-stock-map`, `kardex`

### Ajustes manuales de stock (`useAdjustAlmacenStock`)
1. Calcula nuevo stock
2. Upsert `almacen_stock`
3. Inserta en `kardex`
4. Recalcula total en `product_variants`
5. Log de auditoria
6. Si almacen es "Pagina Web" → sync stock a WC

### Inventario al crear producto
- La tabla de inventario y precios por punto de venta se muestra al crear un producto nuevo
- Al presionar "Crear", se guarda el producto y luego se insertan `almacen_stock` y `almacen_precios` por cada almacen con valores ingresados
- Recalcula `product_variants.stock` con el total sumado
- Si almacen es "Pagina Web" → sync stock a WC

---

## 9. Productos Inactivos (regla global)

### Regla fundamental
> Los productos con `is_active = false` son INVISIBLES en todo el sistema. Se tratan como si estuvieran en papelera de reciclaje.

### Donde se aplica el filtro `is_active = true`
| Modulo | Hook / Query | Archivo |
|--------|-------------|---------|
| POS | `usePosProducts` | `src/features/pos/hooks/usePosProducts.ts` |
| Inventario | `useProductStock` | `src/features/inventory/hooks/useInventory.ts` |
| Inventario expandido | `useAllAlmacenStock` | `src/features/inventory/components/MovementList.tsx` |
| Stock por almacen | `useAlmacenStock` | `src/features/almacenes/hooks/useAlmacenes.ts` |
| Precios por almacen | `useAlmacenPrecios` | `src/features/almacenes/hooks/useAlmacenes.ts` |
| Variantes (dropdown) | `useAllProductVariants` | `src/features/almacenes/hooks/useAlmacenes.ts` |
| Dashboard stats | `useDashboardStats` | `src/features/dashboard/hooks/useDashboardStats.ts` |
| Conteo por categoria | `useProductCountByCategory` | `src/features/catalog/categories/hooks/useCategories.ts` |
| Sync WC individual | `syncProductToWC` | `src/features/catalog/products/utils/syncProductToWC.ts` |
| Sync WC masivo | `handleSyncAllWC` | `src/features/almacenes/components/AlmacenesPage.tsx` |

### Donde NO se filtra (intencionalmente)
| Modulo | Razon |
|--------|-------|
| `useProductById` | Para poder ver/editar un producto desactivado y reactivarlo |
| `ProductList` (con switch Inactivos) | Para que el admin pueda ver y gestionar productos inactivos |
| Historial de movimientos (kardex) | Para preservar trazabilidad historica |
| `vtatkt` (items de venta) | Para preservar historial de ventas |

### Depuracion (eliminacion permanente)
- **Ubicacion:** Configuracion → Depuracion de productos
- **Archivo:** `src/features/settings/components/CleanupSection.tsx`
- **Logica:**
  - Lista productos desactivados
  - Divide en "eliminables" (sin ventas en `vtatkt`) y "protegidos" (con ventas)
  - Eliminacion en cascada: `almacen_stock` → `kardex` → `transferencia_items` → `inventory_movements` → `almacen_precios` → `product_wc_map` → `product_categories` → `product_attributes` → `product_option_groups` → `orden_compra_items` → `product_variants` → `products`
  - Dialog de confirmacion
  - Log de auditoria (`depuracion_productos`)

---

## 10. Etiquetas QR (Cricut)

### Generacion
- PNG a 300 DPI via Canvas API
- QR renderizado con Path2D (no SVG-to-Image)
- Layout vertical: QR grande arriba, texto pequeno abajo
- 3 tamanos: chica (3x2cm), mediana (4x2.5cm), grande (5x3cm)

### Contenido
- QR code (SKU del producto)
- Nombre del producto
- SKU + peso

### Flujo Cricut Print then Cut
1. Descargar PNG desde POS
2. Subir a Cricut Design Space como "Compleja" → "Imprimir luego cortar"
3. Cricut imprime con marcas de registro → corta cada etiqueta

### Archivos
- `src/features/etiquetas/components/EtiquetasPage.tsx`

---

## 11. Calculadora de Precio por Peso

### Ubicacion
Icono calculadora en lista de productos (antes del lapiz de editar)

### Flujo
1. Seleccionar punto de venta → carga precios de almacen_precios
2. Peso base: se pre-llena con `weight_grams` o editable manualmente
3. Gramos deseados: el usuario ingresa el peso
4. Calculo: `nuevo_precio = (precio / peso_base) * gramos_deseados`

### Archivo
- `src/features/catalog/products/components/PriceCalculatorDialog.tsx`

---

## 12. Logs de Auditoria

### Funcion
`logAction(action, details)` — fire-and-forget, registra en `audit_log`

### Acciones registradas
| Accion | Donde |
|--------|-------|
| `producto_creado` | ProductForm |
| `producto_actualizado` | ProductForm |
| `almacen_precio_stock_guardado` | ProductForm (inline) |
| `almacen_precio_actualizado` | useUpsertAlmacenPrecio |
| `stock_ajustado` | useAdjustAlmacenStock |
| `transferencia_creada` | useCreateTransferencia |
| `wc_producto_sincronizado` | syncProductToWC |
| `wc_sync_masivo` | AlmacenesPage |
| `venta` | useSale |
| `pago_registrado` | useRegistrarPago |
| `nota_cancelada` | useCancelNota |
| `nota_eliminada` | useDeleteNota |
| `depuracion_productos` | CleanupSection |

---

## 13. Puntos de Venta (Almacenes)

### Funciones
- Crear, editar nombre/descripcion/direccion/cliente
- Desactivar/activar (excepto "Pagina Web")
- Filtro de inactivos (ocultos por default)
- "Pagina Web" es protegido: no se puede editar nombre ni desactivar
- Boton sync masivo WC en "Pagina Web"
- 4 tabs: Stock, Precios, Kardex, Transferir

### Archivo
- `src/features/almacenes/components/AlmacenesPage.tsx`

---

## 14. Migraciones SQL

| # | Archivo | Descripcion |
|---|---------|-------------|
| 00001 | catalog_schema.sql | Tablas base: products, categories, variants |
| 00002 | storage_bucket.sql | Buckets de storage |
| 00003 | seed_data.sql | Datos iniciales |
| 00020 | precios_mayoreo.sql | Campo precio_mayoreo |
| 00021 | gastos_categorias.sql | Gastos |
| 00022 | notas_venta.sql | Notas, entrega_status, entrega_token |
| 00023 | almacen_precios.sql | Precios por almacen |
| 00024 | product_wc_map.sql | Mapeo POS ↔ WooCommerce |
| 00025 | product_weight.sql | Campo weight_grams |
| 00026 | whatsapp_config.sql | Configuracion WhatsApp |

---

## 15. Variables de Entorno (Vercel)

| Variable | Uso |
|----------|-----|
| `WC_URL` | URL base WooCommerce |
| `WC_CONSUMER_KEY` | WC API key |
| `WC_CONSUMER_SECRET` | WC API secret |
| `GREEN_API_URL` | Green API base URL |
| `GREEN_API_INSTANCE` | Green API instance ID |
| `GREEN_API_TOKEN` | Green API token |

---

## 16. Componentes Principales y Relaciones

```
App.tsx
├── MainLayout (Sidebar + content)
│   ├── DashboardPage (stats + AdvancedReports)
│   ├── PosPage → PosScreen
│   │   ├── ProductGrid (productos con precios de almacen)
│   │   ├── Cart (carrito)
│   │   └── PaymentDialog → toggle entrega → useSale → nota + pagos + stock + kardex + WhatsApp (si entregado)
│   ├── NotasPage → NotasList
│   │   ├── Pagos, entrega, WhatsApp manual
│   │   └── Expandible: items + historial pagos
│   ├── ProductosPage → ProductList
│   │   ├── ProductForm (crear/editar + sync WC)
│   │   ├── PriceCalculatorDialog
│   │   └── Columna WC sync
│   ├── AlmacenesPage
│   │   ├── Stock, Precios, Kardex, Transferencias
│   │   ├── Editar/desactivar almacenes
│   │   └── Sync masivo WC (Pagina Web)
│   ├── InventarioPage → MovementList
│   │   ├── StockAdjustmentDialog (con selector almacen)
│   │   └── Kardex con filtros
│   ├── EtiquetasPage (PNG para Cricut)
│   ├── ConfiguracionPage
│   │   ├── SettingsForm (empresa, ticket, folios)
│   │   ├── WhatsAppSettings (destino, prueba)
│   │   └── CleanupSection (depuracion productos inactivos)
│   └── EntregaPage (publica, sin auth)
└── api/ (serverless)
    ├── wc-proxy.ts
    ├── wc-webhook.ts
    └── whatsapp.ts
```

---

## 17. Relaciones FK de `products`

```
products
├── product_variants (product_id) → almacen_stock, kardex, transferencia_items,
│                                    inventory_movements, orden_compra_items
├── almacen_precios (product_id)
├── product_wc_map (product_id)
├── product_categories (product_id)
├── product_attributes (product_id)
├── product_option_groups (product_id)
├── inventory_movements (product_id)
├── kardex (product_id)
├── transferencia_items (product_id)
├── orden_compra_items (product_id)
└── vtatkt (product_id) — SIN FK constraint, referencia blanda
```

> Al eliminar un producto, se deben borrar en cascada todos los registros hijos.
> Productos con registros en `vtatkt` NO se eliminan para preservar historial.
