import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar, menuItems } from '../Sidebar';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

// We need AuthProvider wrapping for useAuth
import { AuthProvider } from '@/features/auth/AuthProvider';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('Sidebar', () => {
  it('has 14 menu items defined', () => {
    expect(menuItems).toHaveLength(14);
  });

  it('renders non-admin menu items when unauthenticated', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter>
            <Sidebar />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    // Non-admin items should always render
    const nonAdminItems = menuItems.filter((item) => !item.adminOnly);
    for (const item of nonAdminItems) {
      const elements = screen.getAllByText(item.label);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    }
  });
});
