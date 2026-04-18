import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useOptionGroups } from '../hooks/useOptionGroups';
import {
  useProductVariants,
  useProductOptionGroups,
  useAssignOptionGroups,
  useSaveVariants,
  useUpdateVariant,
} from '../hooks/useVariants';
import { generateVariants } from '../utils/generateVariants';
import { VariantTable } from './VariantTable';
import type { ProductVariant } from '@/integrations/supabase/catalog-types';
import type { OptionGroupWithValues } from '../hooks/useOptionGroups';

interface VariantManagerProps {
  productId: string;
  productSku: string;
}

const MAX_GROUPS = 3;
const MAX_VARIANTS_WARNING = 50;

export function VariantManager({ productId, productSku }: VariantManagerProps) {
  const { data: allGroups = [] } = useOptionGroups();
  const { data: variants = [] } = useProductVariants(productId);
  const { data: assignedGroupIds = [] } = useProductOptionGroups(productId);
  const assignGroups = useAssignOptionGroups();
  const saveVariants = useSaveVariants();
  const updateVariant = useUpdateVariant();

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Sync from server on load
  useEffect(() => {
    if (assignedGroupIds.length > 0) {
      setSelectedGroupIds(assignedGroupIds);
    }
  }, [assignedGroupIds]);

  const selectedGroups: OptionGroupWithValues[] = useMemo(
    () => allGroups.filter((g) => selectedGroupIds.includes(g.id)),
    [allGroups, selectedGroupIds],
  );

  const optionGroupNames = useMemo(
    () => selectedGroups.map((g) => g.name),
    [selectedGroups],
  );

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      }
      if (prev.length >= MAX_GROUPS) return prev;
      return [...prev, groupId];
    });
  }

  const previewCount = useMemo(() => {
    const groups = selectedGroups
      .filter((g) => g.values.length > 0)
      .map((g) => g.values.length);
    if (groups.length === 0) return 0;
    return groups.reduce((acc, len) => acc * len, 1);
  }, [selectedGroups]);

  const handleGenerate = useCallback(async () => {
    // Save group assignments
    await assignGroups.mutateAsync({ productId, groupIds: selectedGroupIds });

    // Generate variant combinations
    const groupInputs = selectedGroups
      .filter((g) => g.values.length > 0)
      .map((g) => ({
        name: g.name,
        values: g.values.map((v) => v.value),
      }));

    const generated = generateVariants(groupInputs, productSku);

    const variantInserts = generated.map((v) => ({
      sku: v.sku,
      option_values: v.option_values,
      stock: 0,
      is_active: true,
    }));

    await saveVariants.mutateAsync({ productId, variants: variantInserts });
  }, [productId, productSku, selectedGroupIds, selectedGroups, assignGroups, saveVariants]);

  function handleUpdateVariant(id: string, field: string, value: string | number | boolean | null) {
    updateVariant.mutate({ id, [field]: value });
  }

  const isGenerating = assignGroups.isPending || saveVariants.isPending;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Variantes
      </h3>

      {/* Group selector */}
      <div className="space-y-2">
        <Label>Grupos de opciones (max {MAX_GROUPS})</Label>
        {allGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay grupos de opciones. Crea grupos primero en la seccion de opciones.
          </p>
        ) : (
          <div className="space-y-2">
            {allGroups.map((group) => (
              <div key={group.id} className="flex items-center gap-2">
                <Switch
                  checked={selectedGroupIds.includes(group.id)}
                  onCheckedChange={() => toggleGroup(group.id)}
                  disabled={
                    !selectedGroupIds.includes(group.id) &&
                    selectedGroupIds.length >= MAX_GROUPS
                  }
                  aria-label={`Asignar grupo ${group.name}`}
                />
                <span className="text-sm">{group.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({group.values.length} valor{group.values.length !== 1 ? 'es' : ''})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      {selectedGroupIds.length > 0 && (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => void handleGenerate()}
            disabled={isGenerating || previewCount === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            Generar {previewCount} variante{previewCount !== 1 ? 's' : ''}
          </Button>
          {previewCount > MAX_VARIANTS_WARNING && (
            <span className="text-xs text-yellow-600">
              Se generaran muchas variantes. Considera reducir valores.
            </span>
          )}
        </div>
      )}

      <Separator />

      {/* Variant table */}
      <VariantTable
        variants={variants}
        optionGroupNames={optionGroupNames}
        onUpdateVariant={handleUpdateVariant}
      />
    </div>
  );
}
