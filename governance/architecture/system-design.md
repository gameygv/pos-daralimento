---
type: architecture_design
project: "pos-daralimento"
status: active
layers:
  - name: presentation
    description: Componentes UI, páginas, layouts, theme
  - name: features
    description: Módulos de negocio autocontenidos (POS, catálogo, inventario, etc.)
  - name: integrations
    description: Cliente Supabase, tipos de DB, admin client
  - name: database
    description: PostgreSQL vía Supabase, migraciones SQL, RLS
---

# System Design: POS DAR Alimento

> C4 Level 2 — Descomposición en componentes

## Architecture Overview

SPA basada en features (feature-sliced), donde cada módulo de negocio es autocontenido con sus componentes, hooks, schemas y tests. La comunicación con el backend es exclusivamente via Supabase JS SDK (PostgREST + Auth + Storage).

## Components

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| `src/features/pos/` | Pantalla de punto de venta: carrito, cobro, escáner | React + useCart + useSale |
| `src/features/catalog/` | Productos, categorías, variantes, opciones | React + Zod schemas + useProducts |
| `src/features/inventory/` | Movimientos de stock, ajustes | React + useInventory |
| `src/features/almacenes/` | Almacenes, kardex, transferencias | React + useAlmacenes |
| `src/features/cajas/` | Cajas registradoras, sesiones, folios | React + useCajas |
| `src/features/corte/` | Cortes de caja diarios | React + useCortes |
| `src/features/customers/` | CRUD de clientes | React + useCustomers |
| `src/features/creditos/` | Sistema de crédito y movimientos | React + useCreditos |
| `src/features/cxc/` | Cuentas por cobrar, antigüedad | React + useCxC |
| `src/features/reports/` | Reportes de ventas, vendedor, avanzados | React + Recharts |
| `src/features/gastos/` | Gastos operativos | React + useGastos |
| `src/features/cupones/` | Cupones y promociones | React + useCupones |
| `src/features/devoluciones/` | Devoluciones de productos | React + useDevoluciones |
| `src/features/lealtad/` | Programa de lealtad/puntos | React + useLealtad |
| `src/features/tiendas/` | Multi-tienda | React + useTiendas |
| `src/features/ordenes-compra/` | Órdenes de compra a proveedores | React + useOrdenesCompra |
| `src/features/users/` | Gestión de usuarios y permisos | React + useUsers |
| `src/features/auth/` | Autenticación, rutas protegidas, roles | Supabase Auth + AuthProvider |
| `src/features/settings/` | Configuración de empresa y ticket | React + useSettings |
| `src/features/logs/` | Auditoría | React + useLogs |
| `src/features/etiquetas/` | Etiquetas de precio | React |
| `src/features/dashboard/` | KPIs y resumen | React + useDashboardStats |
| `src/components/ui/` | Componentes UI reutilizables (shadcn/Radix) | Radix UI + Tailwind |
| `src/integrations/supabase/` | Cliente Supabase, tipos, admin | @supabase/supabase-js |

## Key Decisions

- **ADR-001**: Esquema de catálogo con productos → variantes → opciones (ver `dev/decisions/adr-001-catalog-schema.md`)
- **Feature-based architecture**: cada módulo es independiente, comunicación solo via Supabase
- **No BFF/API**: el SPA se comunica directamente con Supabase PostgREST, confiando en RLS para seguridad
