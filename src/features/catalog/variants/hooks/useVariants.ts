import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProductVariant, ProductVariantInsert } from '@/integrations/supabase/catalog-types';

const VARIANTS_KEY = ['product-variants'] as const;
const PRODUCT_OPTION_GROUPS_KEY = ['product-option-groups'] as const;

export function useProductVariants(productId: string | null) {
  return useQuery<ProductVariant[]>({
    queryKey: [...VARIANTS_KEY, productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await (supabase
        .from('product_variants' as never)
        .select('*')
        .eq('product_id', productId)
        .order('sku') as unknown as Promise<{ data: ProductVariant[] | null; error: { message: string } | null }>);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!productId,
  });
}

export function useProductOptionGroups(productId: string | null) {
  return useQuery<string[]>({
    queryKey: [...PRODUCT_OPTION_GROUPS_KEY, productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await (supabase
        .from('product_option_groups' as never)
        .select('group_id')
        .eq('product_id', productId) as unknown as Promise<{ data: Array<{ group_id: string }> | null; error: { message: string } | null }>);
      if (error) throw error;
      return (data ?? []).map((row) => row.group_id);
    },
    enabled: !!productId,
  });
}

export function useAssignOptionGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, groupIds }: { productId: string; groupIds: string[] }) => {
      // Delete existing assignments
      const { error: deleteError } = await (supabase
        .from('product_option_groups' as never)
        .delete()
        .eq('product_id', productId) as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
      if (deleteError) throw deleteError;

      // Insert new assignments
      if (groupIds.length > 0) {
        const rows = groupIds.map((group_id) => ({ product_id: productId, group_id }));
        const { error: insertError } = await (supabase
          .from('product_option_groups' as never)
          .insert(rows) as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [...PRODUCT_OPTION_GROUPS_KEY, variables.productId] });
    },
  });
}

export function useSaveVariants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, variants }: { productId: string; variants: Omit<ProductVariantInsert, 'product_id'>[] }) => {
      // Delete existing non-default variants (option_values != '{}')
      const { error: deleteError } = await (supabase
        .from('product_variants' as never)
        .delete()
        .eq('product_id', productId)
        .neq('option_values', '{}') as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
      if (deleteError) throw deleteError;

      // Insert new variants
      if (variants.length > 0) {
        const rows = variants.map((v) => ({ ...v, product_id: productId }));
        const { error: insertError } = await (supabase
          .from('product_variants' as never)
          .insert(rows) as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [...VARIANTS_KEY, variables.productId] });
    },
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; sku?: string; price_override?: number | null; stock?: number; is_active?: boolean }) => {
      const { data, error } = await (supabase
        .from('product_variants' as never)
        .update(updates)
        .eq('id', id)
        .select()
        .single() as unknown as Promise<{ data: ProductVariant | null; error: { message: string } | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VARIANTS_KEY });
    },
  });
}

export function useToggleVariantActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase
        .from('product_variants' as never)
        .update({ is_active })
        .eq('id', id) as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VARIANTS_KEY });
    },
  });
}
