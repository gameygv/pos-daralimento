import { z } from 'zod';
import type { ProductType } from '@/integrations/supabase/catalog-types';

const PRODUCT_TYPES = ['physical', 'service', 'event', 'course', 'digital'] as const;

export const PRODUCT_TYPE_CONFIG: Record<ProductType, { label: string; color: string }> = {
  physical: { label: 'Físico', color: 'bg-blue-100 text-blue-800' },
  service:  { label: 'Servicio', color: 'bg-green-100 text-green-800' },
  event:    { label: 'Evento', color: 'bg-purple-100 text-purple-800' },
  course:   { label: 'Curso', color: 'bg-orange-100 text-orange-800' },
  digital:  { label: 'Digital', color: 'bg-cyan-100 text-cyan-800' },
};

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export const productFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  sku: z.string().min(1, 'El SKU es requerido').max(50),
  slug: z.string().min(1, 'El slug es requerido').max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo letras minúsculas, números y guiones'),
  barcode: z.string().max(50).nullable().default(null),
  product_type: z.enum(PRODUCT_TYPES).default('physical'),
  category_id: z.string().uuid().nullable().default(null),
  base_price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_mayoreo: z.coerce.number().min(0).default(0),
  cost: z.coerce.number().min(0).nullable().default(null),
  tax_rate: z.coerce.number().min(0).max(1).default(0.16),
  description: z.string().max(2000).nullable().default(null),
  is_active: z.boolean().default(true),
  track_stock: z.boolean().default(true),
  image_url: z.string().nullable().default(null),
  metadata: z.record(z.unknown()).nullable().default(null),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
