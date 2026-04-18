import { z } from 'zod';

export const optionGroupFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type OptionGroupFormValues = z.infer<typeof optionGroupFormSchema>;

export const optionValueFormSchema = z.object({
  group_id: z.string().uuid('ID de grupo inválido'),
  value: z.string().min(1, 'El valor es requerido').max(100),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type OptionValueFormValues = z.infer<typeof optionValueFormSchema>;

export const variantUpdateSchema = z.object({
  sku: z.string().min(1, 'El SKU es requerido').max(50),
  price_override: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0').nullable().default(null),
  stock: z.coerce.number().int().min(0, 'El stock debe ser mayor o igual a 0').default(0),
  is_active: z.boolean().default(true),
});

export type VariantUpdateValues = z.infer<typeof variantUpdateSchema>;
