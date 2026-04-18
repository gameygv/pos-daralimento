import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
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
