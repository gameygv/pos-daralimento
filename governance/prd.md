# PRD: POS DAR Alimento

> Requisitos funcionales del punto de venta para DAR Alimento

---

## Problem

DAR Alimento necesita un sistema de punto de venta completo para gestionar la venta de carne orgánica (cerdo, pollo, borrego), controlar inventario por corte y peso, manejar créditos de clientes, y generar reportes operativos diarios.

## Goals

- Agilizar el proceso de cobro a menos de 30 segundos por transacción
- Tener visibilidad completa del inventario por almacén y variante
- Controlar créditos y cuentas por cobrar
- Generar reportes de ventas y rentabilidad para toma de decisiones

---

## Requirements

### RF-01: Catálogo de productos
Gestión de productos con categorías jerárquicas, variantes (cortes, pesos), SKU, código de barras, imágenes, precios y costos.

### RF-02: Punto de venta (POS)
Interfaz de cobro con grid de productos, búsqueda rápida, escaneo QR/barcode, carrito con descuentos, y múltiples métodos de pago (efectivo, tarjeta, crédito, transferencia, pago dividido).

### RF-03: Gestión de inventario
Control de stock por variante, movimientos auditados (entrada/salida/ajuste), múltiples almacenes con kardex, transferencias entre almacenes.

### RF-04: Multi-caja
Múltiples cajas registradoras con folios independientes, sesiones de apertura/cierre con saldos, asignación de usuarios a cajas.

### RF-05: Corte de caja
Cierre diario con resumen de ventas, IVA, costo, utilidad, desglose por método de pago, ticket imprimible.

### RF-06: Clientes y créditos
Clientes con límite de crédito, movimientos cargo/abono, saldo, cuentas por cobrar con antigüedad.

### RF-07: Reportes y analítica
Ventas diarias, reportes por vendedor, reportes avanzados con filtros, dashboard con KPIs.

### RF-08: Programa de lealtad
Puntos por peso gastado, niveles (plata/oro), canje, registro de movimientos.

### RF-09: Cupones y promociones
Cupones con descuento porcentual/fijo, vigencia, uso único/múltiple.

### RF-10: Gastos operativos
Registro de gastos con categoría, monto, descripción y fecha.

### RF-11: Órdenes de compra
Proveedores, órdenes de compra con ítems, seguimiento de estados.

### RF-12: Multi-tienda
Múltiples sucursales con asignación de usuarios y almacenes.

### RF-13: Autenticación y permisos
Login email/contraseña (Supabase Auth), roles admin/venta, permisos por módulo.

### RF-14: Devoluciones
Devolución de productos con actualización de stock y auditoría.

### RF-15: Etiquetas
Generación e impresión de etiquetas de precio.

### RF-16: Auditoría
Log de acciones del sistema para trazabilidad.
