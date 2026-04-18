---
type: architecture_context
project: "pos-daralimento"
status: active
tech_stack:
  frontend: "React 19 + TypeScript 5.6 + Vite 6.3"
  styling: "TailwindCSS 4.0 + Radix UI (shadcn)"
  state: "TanStack React Query 5.56"
  database: "PostgreSQL 15 (Supabase self-hosted)"
  auth: "Supabase Auth (GoTrue)"
  hosting: "Vercel (SPA)"
external_dependencies:
  - supabase
  - vercel
users:
  - vendedor
  - administrador
governed_by:
  - "governance/guardrails.md"
---

# System Context: POS DAR Alimento

> C4 Level 1 — Sistema y actores externos

## Overview

POS DAR Alimento es una Single Page Application (SPA) React que se comunica directamente con un backend Supabase self-hosted. Los vendedores operan el POS desde navegadores web, mientras que los administradores gestionan catálogo, inventario, reportes y configuración.

## Context Diagram

```
┌──────────────┐       ┌───────────────────────┐       ┌──────────────────┐
│  Vendedor    │──────►│   POS DAR Alimento    │◄──────│  Supabase        │
│  (browser)   │       │   (React SPA)         │       │  (Auth + DB +    │
├──────────────┤       │   Vercel hosting      │       │   Storage)       │
│ Administrador│──────►│                       │       │  EasyPanel VPS   │
│  (browser)   │       └───────────────────────┘       └──────────────────┘
└──────────────┘
```

## External Interfaces

| System | Direction | Protocol | Description |
|--------|-----------|----------|-------------|
| Supabase Auth | bidirectional | HTTPS (REST) | Autenticación email/password, sesiones JWT |
| Supabase PostgREST | bidirectional | HTTPS (REST) | CRUD de todas las tablas del POS vía API auto-generada |
| Supabase Storage | bidirectional | HTTPS (REST) | Almacenamiento de imágenes de productos (bucket `product-images`) |
| Vercel | outbound (deploy) | HTTPS | Hosting del SPA, CDN, env vars de build |
