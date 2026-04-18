import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OptionGroupManager } from '../OptionGroupManager';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const mockMutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock('../../hooks/useOptionGroups', () => ({
  useOptionGroups: vi.fn(),
  useCreateOptionGroup: vi.fn(() => mockMutation),
  useUpdateOptionGroup: vi.fn(() => mockMutation),
  useDeleteOptionGroup: vi.fn(() => mockMutation),
  useCreateOptionValue: vi.fn(() => mockMutation),
  useDeleteOptionValue: vi.fn(() => mockMutation),
}));

import { useOptionGroups } from '../../hooks/useOptionGroups';
const mockUseOptionGroups = vi.mocked(useOptionGroups);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('OptionGroupManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseOptionGroups.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useOptionGroups>);

    renderWithProviders(<OptionGroupManager />);
    expect(screen.getByText('Cargando grupos de opciones...')).toBeInTheDocument();
  });

  it('renders empty state when no groups', () => {
    mockUseOptionGroups.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOptionGroups>);

    renderWithProviders(<OptionGroupManager />);
    expect(screen.getByText('No hay grupos de opciones')).toBeInTheDocument();
  });

  it('renders groups with value counts', () => {
    mockUseOptionGroups.mockReturnValue({
      data: [
        {
          id: '1',
          name: 'Tamano',
          sort_order: 0,
          values: [
            { id: 'v1', group_id: '1', value: 'S', sort_order: 0 },
            { id: 'v2', group_id: '1', value: 'M', sort_order: 1 },
            { id: 'v3', group_id: '1', value: 'L', sort_order: 2 },
          ],
        },
        {
          id: '2',
          name: 'Color',
          sort_order: 1,
          values: [
            { id: 'v4', group_id: '2', value: 'Rojo', sort_order: 0 },
          ],
        },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOptionGroups>);

    renderWithProviders(<OptionGroupManager />);
    expect(screen.getByText('Tamano')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('3 valores')).toBeInTheDocument();
    expect(screen.getByText('1 valor')).toBeInTheDocument();
  });

  it('renders add group input and button', () => {
    mockUseOptionGroups.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOptionGroups>);

    renderWithProviders(<OptionGroupManager />);
    expect(screen.getByPlaceholderText('Nuevo grupo (ej: Tamano, Color)')).toBeInTheDocument();
    expect(screen.getByText('Agregar')).toBeInTheDocument();
  });

  it('renders title', () => {
    mockUseOptionGroups.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOptionGroups>);

    renderWithProviders(<OptionGroupManager />);
    expect(screen.getByText('Grupos de Opciones')).toBeInTheDocument();
  });
});
