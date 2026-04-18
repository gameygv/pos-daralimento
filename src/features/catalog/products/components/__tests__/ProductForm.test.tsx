import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductForm } from '../ProductForm';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('../../hooks/useProducts', () => ({
  useProducts: vi.fn(() => ({ data: [] })),
  useProductById: vi.fn(() => ({ data: null })),
  useCreateProduct: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateProduct: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useToggleProductActive: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('@/features/catalog/categories', () => ({
  useCategoryList: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/features/catalog/categories/utils/slugify', () => ({
  slugify: vi.fn((text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  ),
}));

vi.mock('@/features/catalog/variants/components/VariantManager', () => ({
  VariantManager: () => <div data-testid="variant-manager">VariantManager</div>,
}));

vi.mock('@/components/ImageUpload', () => ({
  ImageUpload: ({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) => (
    <div data-testid="image-upload">
      {value && <img src={value} alt="preview" />}
      <button type="button" onClick={() => onChange('https://test.com/img.jpg')}>Upload</button>
      <button type="button" onClick={() => onChange(null)}>Remove</button>
    </div>
  ),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('ProductForm', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    productId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create mode with empty fields', () => {
    renderWithProviders(<ProductForm {...defaultProps} />);
    expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveValue('');
    expect(screen.getByLabelText('SKU')).toHaveValue('');
    expect(screen.getByText('Crear')).toBeInTheDocument();
  });

  it('shows product type options', () => {
    renderWithProviders(<ProductForm {...defaultProps} />);
    // The type section header is present
    expect(screen.getByText('Clasificación')).toBeInTheDocument();
    // The select trigger shows default
    expect(screen.getAllByText('Físico').length).toBeGreaterThanOrEqual(1);
  });

  it('validates required fields on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductForm {...defaultProps} />);

    const submitBtn = screen.getByText('Crear');
    await user.click(submitBtn);

    expect(await screen.findByText('El nombre es requerido')).toBeInTheDocument();
    expect(await screen.findByText('El SKU es requerido')).toBeInTheDocument();
  });

  it('shows all form sections', () => {
    renderWithProviders(<ProductForm {...defaultProps} />);
    expect(screen.getByText('Información básica')).toBeInTheDocument();
    expect(screen.getByText('Clasificación')).toBeInTheDocument();
    expect(screen.getByText('Precios')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Detalles')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(<ProductForm {...defaultProps} open={false} />);
    expect(screen.queryByText('Nuevo Producto')).not.toBeInTheDocument();
  });

  it('shows pricing fields', () => {
    renderWithProviders(<ProductForm {...defaultProps} />);
    expect(screen.getByLabelText('Precio base')).toBeInTheDocument();
    expect(screen.getByLabelText('Costo')).toBeInTheDocument();
    expect(screen.getByLabelText('Tasa de impuesto')).toBeInTheDocument();
  });

  it('shows settings switches', () => {
    renderWithProviders(<ProductForm {...defaultProps} />);
    expect(screen.getByLabelText('Rastrear inventario')).toBeInTheDocument();
    expect(screen.getByLabelText('Activo')).toBeInTheDocument();
  });
});
