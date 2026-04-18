import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface QuickProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickProductDialog({ open, onOpenChange }: QuickProductDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setName('');
    setSku('');
    setBarcode('');
    setPrice('');
    setCost('');
  }

  async function handleCreate() {
    if (!name.trim() || !price) {
      toast.error('Nombre y precio son requeridos');
      return;
    }

    setSaving(true);

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const generatedSku = sku.trim() || `POS-${Date.now().toString(36).toUpperCase()}`;

    // Create product
    const { data: product, error } = (await supabase
      .from('products' as never)
      .insert({
        name: name.trim(),
        slug: `${slug}-${Date.now()}`,
        sku: generatedSku,
        barcode: barcode.trim() || null,
        base_price: parseFloat(price),
        product_type: 'simple',
        is_active: true,
        track_stock: false,
        tax_rate: 0.16,
      } as never)
      .select('id')
      .single()) as unknown as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (error) {
      toast.error(`Error: ${error.message}`);
      setSaving(false);
      return;
    }

    // Create default variant
    if (product) {
      await supabase
        .from('product_variants' as never)
        .insert({
          product_id: product.id,
          sku: generatedSku,
          price_override: null,
          stock: 0,
          is_active: true,
        } as never);
    }

    toast.success(`Producto "${name.trim()}" creado`);
    void queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    reset();
    setSaving(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Producto Rapido</DialogTitle>
          <DialogDescription>
            Crea un producto directamente desde el POS
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bowl Acai Grande"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Precio *</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Costo</label>
              <Input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">SKU</label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Auto-generado"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Barcode</label>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <Button
            className="h-11 w-full"
            onClick={handleCreate}
            disabled={saving || !name.trim() || !price}
          >
            {saving ? 'Creando...' : 'Crear Producto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
