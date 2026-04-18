import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  slug: z.string().min(1, 'El slug es requerido').max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().max(500).nullable().default(null),
  parent_id: z.string().uuid().nullable().default(null),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  image_url: z.string().nullable().default(null),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
