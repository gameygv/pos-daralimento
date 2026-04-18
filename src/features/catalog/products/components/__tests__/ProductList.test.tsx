import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductList } from '../ProductList';
import type { UseProductsResult } from '../../hooks/useProducts';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('../../hooks/useProducts', () => ({
  useProducts: vi.fn(),
  useToggleProductActive: vi.fn(() => ({ mutate: vi.fn() })),
  useProductById: vi.fn(() => ({ data: null })),
  useCreateProduct: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateProduct: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('@/features/catalog/categories', () => ({
  useCategoryList: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/features/catalog/variants/components/VariantManager', () => ({
  VariantManager: () => null,
}));

vi.mock('@/components/ImageUpload', () => ({
  ImageUpload: () => <div data-testid="image-upload" />,
}));

import { useProducts } from '../../hooks/useProducts';
const mockUseProducts = vi.mocked(useProducts);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

function mockProductsReturn(overrides: Partial<{
  data: UseProductsResult;
  isLoading: boolean;
  error: unknown;
}> = {}) {
  mockUseProducts.mockReturnValue({
    data: overrides.data ?? { products: [], hasNextPage: false, totalFetched: 0 },
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
  } as ReturnType<typeof useProducts>);
}

describe('ProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockProductsReturn({ isLoading: true, data: undefined as unknown as UseProductsResult });

    renderWithProviders(<ProductList />);
    expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
  });

  it('renders empty state when no products', () => {
    mockProductsReturn();

    renderWithProviders(<ProductList />);
    expect(screen.getByText('No hay productos')).toBeInTheDocument();
  });

  it('renders products in table with correct columns', () => {
    mockProductsReturn({
      data: {
        products: [
          {
            id: '1',
            sku: 'CNC-001',
            name: 'Cuenco rústico',
            slug: 'cuenco-rustico',
            product_type: 'physical' as const,
            base_price: 350,
            is_active: true,
            category_name: 'Cerámica',
            variant_count: 2,
            total_stock: 15,
            image_url: null,
          },
          {
            id: '2',
            sku: 'SRV-001',
            name: 'Taller de cerámica',
            slug: 'taller-ceramica',
            product_type: 'service' as const,
            base_price: 1500,
            is_active: false,
            category_name: null,
            variant_count: 0,
            total_stock: 0,
            image_url: null,
          },
        ],
        hasNextPage: false,
        totalFetched: 2,
      },
    });

    renderWithProviders(<ProductList />);

    // Column headers
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Categoría')).toBeInTheDocument();
    expect(screen.getByText('Precio')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();

    // Product data
    expect(screen.getByText('Cuenco rústico')).toBeInTheDocument();
    expect(screen.getByText('CNC-001')).toBeInTheDocument();
    expect(screen.getByText('Físico')).toBeInTheDocument();
    expect(screen.getByText('Cerámica')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('Taller de cerámica')).toBeInTheDocument();
    expect(screen.getByText('SRV-001')).toBeInTheDocument();
    expect(screen.getByText('Servicio')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument(); // null category
  });

  it('displays type badges with correct labels', () => {
    mockProductsReturn({
      data: {
        products: [
          {
            id: '1',
            sku: 'EVT-001',
            name: 'Expo cerámica',
            slug: 'expo-ceramica',
            product_type: 'event' as const,
            base_price: 200,
            is_active: true,
            category_name: null,
            variant_count: 0,
            total_stock: 0,
            image_url: null,
          },
        ],
        hasNextPage: false,
        totalFetched: 1,
      },
    });

    renderWithProviders(<ProductList />);
    expect(screen.getByText('Evento')).toBeInTheDocument();
  });

  it('renders Nuevo Producto button', () => {
    mockProductsReturn();

    renderWithProviders(<ProductList />);
    expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
  });

  // --- S1.6 new tests ---

  it('displays results count', () => {
    mockProductsReturn({
      data: {
        products: [
          {
            id: '1', sku: 'P-001', name: 'Producto 1', slug: 'p1',
            product_type: 'physical', base_price: 100, is_active: true,
            category_name: null, variant_count: 1, total_stock: 10,
            image_url: null,
          },
        ],
        hasNextPage: false,
        totalFetched: 1,
      },
    });

    renderWithProviders(<ProductList />);
    expect(screen.getByText(/Mostrando 1 de 1 productos/)).toBeInTheDocument();
  });

  it('renders pagination controls', () => {
    mockProductsReturn({
      data: {
        products: [],
        hasNextPage: true,
        totalFetched: 0,
      },
    });

    renderWithProviders(<ProductList />);
    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
    expect(screen.getByText('Página 1')).toBeInTheDocument();
  });

  it('disables Anterior button on first page', () => {
    mockProductsReturn({
      data: { products: [], hasNextPage: true, totalFetched: 0 },
    });

    renderWithProviders(<ProductList />);
    const prevButton = screen.getByText('Anterior').closest('button');
    expect(prevButton).toBeDisabled();
  });

  it('disables Siguiente button when no next page', () => {
    mockProductsReturn({
      data: { products: [], hasNextPage: false, totalFetched: 0 },
    });

    renderWithProviders(<ProductList />);
    const nextButton = screen.getByText('Siguiente').closest('button');
    expect(nextButton).toBeDisabled();
  });

  it('enables Siguiente button when hasNextPage is true', () => {
    mockProductsReturn({
      data: { products: [], hasNextPage: true, totalFetched: 0 },
    });

    renderWithProviders(<ProductList />);
    const nextButton = screen.getByText('Siguiente').closest('button');
    expect(nextButton).not.toBeDisabled();
  });

  it('renders stock filter dropdown', () => {
    mockProductsReturn();

    renderWithProviders(<ProductList />);
    expect(screen.getByText('Todo el stock')).toBeInTheDocument();
  });

  it('does not show Limpiar filtros when no filters active', () => {
    mockProductsReturn();

    renderWithProviders(<ProductList />);
    expect(screen.queryByText('Limpiar filtros')).not.toBeInTheDocument();
  });

  it('shows Limpiar filtros when search is active', () => {
    mockProductsReturn();

    renderWithProviders(<ProductList />);
    const input = screen.getByPlaceholderText('Buscar por nombre, SKU o código...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getByText('Limpiar filtros')).toBeInTheDocument();
  });

  it('clears search when Limpiar filtros is clicked', () => {
    mockProductsReturn();

    renderWithProviders(<ProductList />);
    const input = screen.getByPlaceholderText('Buscar por nombre, SKU o código...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Limpiar filtros'));
    expect(input.value).toBe('');
  });
});
