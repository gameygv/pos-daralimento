import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryTree } from '../CategoryTree';

vi.mock('../../hooks/useCategories', () => ({
  useCategories: vi.fn(),
  useCategoryList: vi.fn(() => ({ data: [] })),
  useToggleCategoryActive: vi.fn(() => ({ mutate: vi.fn() })),
  useCreateCategory: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateCategory: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteCategory: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useMoveProducts: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useProductCountByCategory: vi.fn(() => ({ data: 0 })),
}));

import { useCategories } from '../../hooks/useCategories';
const mockUseCategories = vi.mocked(useCategories);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('CategoryTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseCategories.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useCategories>);

    renderWithProviders(<CategoryTree />);
    expect(screen.getByText('Cargando categorías...')).toBeInTheDocument();
  });

  it('renders empty state when no categories', () => {
    mockUseCategories.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useCategories>);

    renderWithProviders(<CategoryTree />);
    expect(screen.getByText('No hay categorías. Crea la primera.')).toBeInTheDocument();
  });

  it('renders categories with names', () => {
    mockUseCategories.mockReturnValue({
      data: [
        { id: '1', name: 'Cuencos', slug: 'cuencos', parent_id: null, depth: 0, sort_order: 0, is_active: true },
        { id: '2', name: 'Talleres', slug: 'talleres', parent_id: null, depth: 0, sort_order: 1, is_active: true },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useCategories>);

    renderWithProviders(<CategoryTree />);
    expect(screen.getByText('Cuencos')).toBeInTheDocument();
    expect(screen.getByText('Talleres')).toBeInTheDocument();
  });

  it('renders inactive badge for inactive categories', () => {
    mockUseCategories.mockReturnValue({
      data: [
        { id: '1', name: 'Cerámica', slug: 'ceramica', parent_id: null, depth: 0, sort_order: 0, is_active: false },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useCategories>);

    renderWithProviders(<CategoryTree />);
    expect(screen.getByText('Cerámica')).toBeInTheDocument();
    expect(screen.getByText('Cerámica').closest('span')).toHaveClass('line-through');
    expect(screen.getByText('Inactiva')).toBeInTheDocument(); // badge
  });

  it('renders error state', () => {
    mockUseCategories.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    } as ReturnType<typeof useCategories>);

    renderWithProviders(<CategoryTree />);
    expect(screen.getByText(/Error al cargar categorías/)).toBeInTheDocument();
  });
});
