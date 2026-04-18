---
type: architecture_domain_model
project: "pos-daralimento"
status: active
bounded_contexts:
  - name: catalog
    description: Productos, categorías, variantes y opciones
  - name: sales
    description: POS, tickets, cajas, cortes, cupones, devoluciones
  - name: inventory
    description: Stock, movimientos, almacenes, kardex, transferencias
  - name: finance
    description: Créditos, lealtad, gastos, órdenes de compra, CxC
  - name: identity
    description: Auth, permisos, configuración, auditoría, tiendas
shared_kernel:
  supabase_client: "src/integrations/supabase/client.ts"
  ui_components: "src/components/ui/"
---

# Domain Model: POS DAR Alimento

> Contextos acotados y entidades del dominio

## Bounded Contexts

### Catálogo
Entidades: `categories`, `products`, `product_variants`, `option_groups`, `option_values`, `product_option_groups`, `product_attributes`
- Producto tiene categoría (jerárquica), variantes con stock y precio, opciones agrupadas
- Tipos de producto: physical, service, event, course, digital

### Ventas
Entidades: `vtatkt` (ticket de venta), `cajas`, `caja_sessions`, `corte`, `cupones`, `devoluciones`
- Flujo: POS → carrito → pago → vtatkt (líneas de ticket) → folio por caja
- Métodos: efectivo, tarjeta, crédito, transferencia, pago dividido
- Corte de caja: cierre diario con totales y IVA

### Inventario
Entidades: `inventory_movements`, `almacenes`, `almacen_stock`, `kardex`, `transferencias`, `transferencia_items`
- Stock por variante y almacén
- Movimientos: entrada, salida, ajuste (auditados)
- Kardex como libro mayor de movimientos por almacén

### Finanzas
Entidades: `clientes`, `credito_movimientos`, `lealtad_config`, `lealtad_movimientos`, `gastos`, `ordenes_compra`, `orden_compra_items`, `proveedores`
- Crédito: límite por cliente, movimientos cargo/abono
- Lealtad: puntos por peso gastado, niveles, canje
- CxC: antigüedad de saldos pendientes

### Identidad y Control
Entidades: `pvcntl` (configuración), `tiendas`, `tienda_users`, `caja_users`, `audit_log`
- Autenticación vía Supabase Auth (JWT)
- Roles: admin, venta
- Permisos granulares por módulo
- Auditoría de acciones

## Shared Kernel

- **Supabase Client**: `src/integrations/supabase/client.ts` — instancia compartida por todos los contextos
- **UI Components**: `src/components/ui/` — shadcn/Radix primitivos compartidos
- **Layouts**: `src/components/layouts/` — MainLayout, Sidebar
- **Utils**: `src/lib/utils.ts`, `src/lib/permissions.ts`
