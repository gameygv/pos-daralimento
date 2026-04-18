# ADR-001: Catalog Schema — Normalized Tables vs Flat Product Table

## Status

Accepted

## Context

The base project (sisko-minierp001) uses a single flat table `artimtr` for products: code, barcode, description, unit, stock, price, cost, margin, discount, commission, min stock, IVA. No categories, no variants, no attributes, no product types.

The Elephant Bowl needs to sell: physical products (bowls, souvenirs), services (therapy sessions), events (concerts), courses (workshops), and digital items. Each product type has different attributes and some need variants (size, color, material).

## Options

### A: Extend flat table with JSON columns
Add `category_id`, `product_type`, and a `metadata JSONB` column for variants/attributes.
- Pro: Minimal migration, flexible
- Con: No referential integrity on variants, hard to query/filter, no stock per variant

### B: Normalized relational schema (chosen)
Separate tables: `categories`, `products`, `product_variants`, `variant_options`, `product_attributes`.
- Pro: Referential integrity, stock per variant, queryable, extensible
- Con: More tables, more complex queries

### C: EAV (Entity-Attribute-Value)
Generic attribute table for everything.
- Pro: Maximum flexibility
- Con: Complex queries, poor performance, hard to validate

## Decision

**Option B: Normalized relational schema.** Categories use adjacency list (parent_id) with recursive CTEs for tree queries. Variants use option groups (e.g., "Size" → S/M/L) with a junction table for SKU-level variant combinations. Product types are an enum column that determines which attributes are relevant.

## Consequences

- Need recursive CTEs for category tree — Supabase/PostgreSQL supports this natively
- Stock tracked at variant level (products without variants get a single default variant)
- Product search needs to join across tables — mitigated by database views or RPC functions
- Schema is more complex but future-proof for e-commerce (E8)
