import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Category, CategoryInsert } from '@/integrations/supabase/catalog-types';

const CATEGORIES_KEY = ['categories'] as const;

/** Extended tree node that includes is_active for admin view. */
export interface AdminCategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  description: string | null;
  image_url: string | null;
  depth: number;
}

/**
 * Fetch all categories (active + inactive) and compute depth client-side.
 * Uses direct table query instead of RPC because the RPC filters WHERE is_active = true,
 * but admins need to see inactive categories to reactivate them (design decision D4).
 */
export function useCategories() {
  return useQuery<AdminCategoryTreeNode[]>({
    queryKey: CATEGORIES_KEY,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('categories' as never)
        .select('id, name, slug, parent_id, sort_order, is_active, description, image_url') as unknown as Promise<{ data: Category[] | null; error: { message: string } | null }>);
      if (error) throw error;
      return buildTree(data ?? []);
    },
  });
}

/** Build a depth-ordered flat list from categories, mimicking the RPC output. */
function buildTree(categories: Category[]): AdminCategoryTreeNode[] {
  const childrenMap = new Map<string | null, Category[]>();
  for (const cat of categories) {
    const key = cat.parent_id;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(cat);
  }

  const result: AdminCategoryTreeNode[] = [];

  function walk(parentId: string | null, depth: number) {
    const children = childrenMap.get(parentId) ?? [];
    children.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    for (const child of children) {
      result.push({
        id: child.id,
        name: child.name,
        slug: child.slug,
        parent_id: child.parent_id,
        sort_order: child.sort_order,
        is_active: child.is_active,
        description: child.description ?? null,
        image_url: child.image_url ?? null,
        depth,
      });
      walk(child.id, depth + 1);
    }
  }

  walk(null, 0);
  return result;
}

export function useCategoryList() {
  return useQuery<Category[]>({
    queryKey: [...CATEGORIES_KEY, 'flat'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('categories' as never)
        .select('*')
        .eq('is_active', true)
        .order('name') as unknown as Promise<{ data: Category[] | null; error: { message: string } | null }>);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: CategoryInsert) => {
      const { data, error } = await (supabase
        .from('categories' as never)
        .insert(category)
        .select()
        .single() as unknown as Promise<{ data: Category | null; error: { message: string } | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CategoryInsert>) => {
      const { data, error } = await (supabase
        .from('categories' as never)
        .update(updates)
        .eq('id', id)
        .select()
        .single() as unknown as Promise<{ data: Category | null; error: { message: string } | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}

export function useToggleCategoryActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase
        .from('categories' as never)
        .update({ is_active })
        .eq('id', id) as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}

export function useProductCountByCategory(categoryId: string | null) {
  return useQuery<number>({
    queryKey: ['product-count', categoryId],
    queryFn: async () => {
      if (!categoryId) return 0;
      const { count, error } = (await supabase
        .from('products' as never)
        .select('id', { count: 'exact', head: true })
        .eq('category_id' as never, categoryId as never)) as unknown as {
        count: number | null;
        error: { message: string } | null;
      };
      if (error) throw error;
      return count ?? 0;
    },
    enabled: categoryId !== null,
  });
}

export function useMoveProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromCategoryId, toCategoryId }: { fromCategoryId: string; toCategoryId: string }) => {
      const { error } = await (supabase
        .from('products' as never)
        .update({ category_id: toCategoryId } as never)
        .eq('category_id' as never, fromCategoryId as never) as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('categories' as never)
        .delete()
        .eq('id' as never, id as never) as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}
