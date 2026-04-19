import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogRow {
  id: number;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  details: Record<string, unknown> | null;
}

const LOGS_KEY = ['audit-logs'] as const;

/** Log an action to audit_log — fire and forget */
export function logAction(action: string, details?: Record<string, unknown>) {
  // Get current user from supabase auth
  supabase.auth.getUser().then(({ data }) => {
    const user = data?.user;
    supabase.from('audit_log' as never).insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      action,
      details: details ?? null,
    }).then(() => {});
  });
}

export function useLogs(actionFilter?: string | null) {
  return useQuery<AuditLogRow[]>({
    queryKey: [...LOGS_KEY, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_log' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (actionFilter) {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = (await query) as unknown as {
        data: AuditLogRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}
