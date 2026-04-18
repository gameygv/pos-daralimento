---
type: guardrails
version: "1.0.0"
---

# Guardrails: POS DAR Alimento

> Reglas de código, arquitectura y operación

---

## Guardrails Activos

### Code Quality

| ID | Level | Guardrail | Verification | Derived from |
|----|-------|-----------|--------------|--------------|
| GR-01 | must | Feature-based structure: cada feature en `src/features/{name}/` con subdirs `components/`, `hooks/`, `schemas/`, `index.ts` | Glob pattern check | Convención detectada |
| GR-02 | must | Zod schemas para validación de formularios | Grep `z.object` en schemas/ | RF-01, RF-06 |
| GR-03 | must | React Query para estado del servidor — no estado global custom | Grep `useQuery`, `useMutation` | Convención detectada |
| GR-04 | must | RLS habilitado en TODAS las tablas de Supabase | SQL check `relrowsecurity` | RF-13, Seguridad |
| GR-05 | should | Tests con Vitest + React Testing Library para componentes y hooks críticos | `pnpm test:run` | Calidad |
| GR-06 | must | No secrets en código fuente — usar `VITE_` env vars para valores públicos, server-side para secrets | Grep `apikey\|secret\|password` en src/ | Seguridad |

### Architecture

| ID | Level | Guardrail | Verification | Derived from |
|----|-------|-----------|--------------|--------------|
| GR-07 | must | SPA en Vite — sin SSR, sin API routes propias | Build output check | Arquitectura |
| GR-08 | must | Supabase como única fuente de datos — no APIs externas para datos de negocio | Grep fetch/axios en src/ | RF-01..RF-16 |
| GR-09 | must | DDL vía migraciones SQL en `supabase/migrations/` — ejecutar con `-U supabase_admin` en VPS | Migration file exists | Operación |
| GR-10 | should | Migraciones idempotentes (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) | SQL review | Operación |

### Operations

| ID | Level | Guardrail | Verification | Derived from |
|----|-------|-----------|--------------|--------------|
| GR-11 | must | Deploy a Vercel vía push a `main` o CLI `vercel --prod` | Vercel dashboard | Operación |
| GR-12 | must | DB container: `main_supabase-daralimento-db-1`, conectar con `supabase_admin` para DDL | SSH check | Operación |
| GR-13 | should | Nombres de entidades en español (tablas, campos) para consistencia con dominio | Code review | Convención detectada |
