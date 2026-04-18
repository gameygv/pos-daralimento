import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // First check auth user_metadata (set at user creation)
      const metaRole = (user.user_metadata as Record<string, unknown>)?.role as string | undefined;
      if (metaRole) return metaRole;

      // Fallback: check vende table
      const { data } = (await supabase
        .from('vende' as never)
        .select('role')
        .eq('codven' as never, user.id as never)
        .single()) as unknown as {
        data: { role: string } | null;
      };
      return (data?.role as string) ?? 'vendedor';
    },
    enabled: !!user,
  });
}
