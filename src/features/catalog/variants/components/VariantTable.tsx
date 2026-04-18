import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { ProductVariant } from '@/integrations/supabase/catalog-types';
import { formatPrice } from '@/features/catalog/products/schemas/product.schema';

interface VariantTableProps {
  variants: ProductVariant[];
  optionGroupNames: string[];
  onUpdateVariant: (id: string, field: string, value: string | number | boolean | null) => void;
}

function getOptionValue(variant: ProductVariant, groupName: string): string {
  const opts = variant.option_values as Record<string, string> | null;
  return opts?.[groupName] ?? '';
}

/**
 * Filters out the default variant (empty option_values) when explicit variants exist.
 */
function filterDefaultVariant(variants: ProductVariant[]): ProductVariant[] {
  const explicitVariants = variants.filter((v) => {
    const opts = v.option_values;
    if (opts === null || opts === undefined) return false;
    if (typeof opts === 'object' && !Array.isArray(opts) && Object.keys(opts as Record<string, unknown>).length === 0) return false;
    return true;
  });
  return explicitVariants.length > 0 ? explicitVariants : variants;
}

export function VariantTable({ variants, optionGroupNames, onUpdateVariant }: VariantTableProps) {
  const displayVariants = filterDefaultVariant(variants);

  if (displayVariants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay variantes generadas
      </p>
    );
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {optionGroupNames.map((name) => (
              <TableHead key={name}>{name}</TableHead>
            ))}
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Precio override</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Activo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayVariants.map((variant) => (
            <TableRow key={variant.id}>
              {optionGroupNames.map((name) => (
                <TableCell key={name} className="text-sm font-medium">
                  {getOptionValue(variant, name)}
                </TableCell>
              ))}
              <TableCell>
                <Input
                  className="h-7 text-xs w-32"
                  value={variant.sku}
                  onChange={(e) => onUpdateVariant(variant.id, 'sku', e.target.value)}
                />
              </TableCell>
              <TableCell className="text-right">
                <Input
                  className="h-7 text-xs w-24 text-right"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={formatPrice(0)}
                  value={variant.price_override ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateVariant(
                      variant.id,
                      'price_override',
                      val === '' ? null : Number(val),
                    );
                  }}
                />
              </TableCell>
              <TableCell className="text-right">
                <Input
                  className="h-7 text-xs w-20 text-right"
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(e) =>
                    onUpdateVariant(variant.id, 'stock', Number(e.target.value))
                  }
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={variant.is_active}
                  onCheckedChange={(checked) =>
                    onUpdateVariant(variant.id, 'is_active', checked)
                  }
                  aria-label={`${variant.is_active ? 'Desactivar' : 'Activar'} variante ${variant.sku}`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
