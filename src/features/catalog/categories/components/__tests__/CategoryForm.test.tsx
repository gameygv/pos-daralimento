import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryForm } from '../CategoryForm';

// Radix UI Select uses ResizeObserver which is not available in jsdom
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('@/components/ImageUpload', () => ({
  ImageUpload: () => <div data-testid="image-upload" />,
}));

vi.mock('../../hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({ data: [] })),
  useCategoryList: vi.fn(() => ({ data: [] })),
  useToggleCategoryActive: vi.fn(() => ({ mutate: vi.fn() })),
  useCreateCategory: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateCategory: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('CategoryForm', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    category: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create mode with empty fields', () => {
    renderWithProviders(<CategoryForm {...defaultProps} />);
    expect(screen.getByText('Nueva Categoría')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveValue('');
    expect(screen.getByLabelText('Slug')).toHaveValue('');
    expect(screen.getByText('Crear')).toBeInTheDocument();
  });

  it('renders edit mode with pre-filled fields', () => {
    const category = {
      id: '1',
      name: 'Cuencos',
      slug: 'cuencos',
      parent_id: null,
      depth: 0,
      sort_order: 0,
      is_active: true,
    };

    renderWithProviders(<CategoryForm {...defaultProps} category={category} />);
    expect(screen.getByText('Editar Categoría')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveValue('Cuencos');
    expect(screen.getByLabelText('Slug')).toHaveValue('cuencos');
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });

  it('validates name is required on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryForm {...defaultProps} />);

    // Set a valid slug so we only test name validation
    const slugInput = screen.getByLabelText('Slug');
    await user.type(slugInput, 'test-slug');

    const submitBtn = screen.getByText('Crear');
    await user.click(submitBtn);

    expect(await screen.findByText('El nombre es requerido')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(<CategoryForm {...defaultProps} open={false} />);
    expect(screen.queryByText('Nueva Categoría')).not.toBeInTheDocument();
  });
});
