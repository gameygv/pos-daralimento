import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

vi.mock('@/integrations/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe('App', () => {
  it('renders login page when unauthenticated', async () => {
    render(<App />);

    // Unauthenticated users get redirected to login
    expect(await screen.findByText('Inicia sesion para continuar')).toBeInTheDocument();
  });

  it('renders 404 page for unknown routes', async () => {
    // Set the URL to an unknown route before rendering
    window.history.pushState({}, '', '/unknown-route-xyz');

    render(<App />);

    expect(await screen.findByText('404')).toBeInTheDocument();
  });
});
