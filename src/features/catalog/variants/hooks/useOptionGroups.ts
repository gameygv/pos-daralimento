import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OptionGroup, OptionValue } from '@/integrations/supabase/catalog-types';

const OPTION_GROUPS_KEY = ['option-groups'] as const;

export interface OptionGroupWithValues extends OptionGroup {
  values: OptionValue[];
}

export function useOptionGroups() {
  return useQuery<OptionGroupWithValues[]>({
    queryKey: [...OPTION_GROUPS_KEY],
    queryFn: async () => {
      const { data: groups, error: groupsError } = await (supabase
        .from('option_groups' as never)
        .select('*')
        .order('sort_order') as unknown as Promise<{ data: OptionGroup[] | null; error: { message: string } | null }>);
      if (groupsError) throw groupsError;

      const { data: values, error: valuesError } = await (supabase
        .from('option_values' as never)
        .select('*')
        .order('sort_order') as unknown as Promise<{ data: OptionValue[] | null; error: { message: string } | null }>);
      if (valuesError) throw valuesError;

      return (groups ?? []).map((group) => ({
        ...group,
        values: (values ?? []).filter((v) => v.group_id === group.id),
      }));
    },
  });
}

export function useCreateOptionGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, sort_order }: { name: string; sort_order?: number }) => {
      const { data, error } = await (supabase
        .from('option_groups' as never)
        .insert({ name, sort_order: sort_order ?? 0 })
        .select()
        .single() as unknown as Promise<{ data: OptionGroup | null; error: { message: string } | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OPTION_GROUPS_KEY });
    },
  });
}

export function useUpdateOptionGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await (supabase
        .from('option_groups' as never)
        .update({ name })
        .eq('id', id)
        .select()
        .single() as unknown as Promise<{ data: OptionGroup | null; error: { message: string } | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OPTION_GROUPS_KEY });
    },
  });
}

export function useDeleteOptionGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('option_groups' as never)
        .delete()
        .eq('id', id) as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OPTION_GROUPS_KEY });
    },
  });
}

export function useCreateOptionValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ group_id, value, sort_order }: { group_id: string; value: string; sort_order?: number }) => {
      const { data, error } = await (supabase
        .from('option_values' as never)
        .insert({ group_id, value, sort_order: sort_order ?? 0 })
        .select()
        .single() as unknown as Promise<{ data: OptionValue | null; error: { message: string } | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OPTION_GROUPS_KEY });
    },
  });
}

export function useDeleteOptionValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('option_values' as never)
        .delete()
        .eq('id', id) as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OPTION_GROUPS_KEY });
    },
  });
}
