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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAlmacenes } from '@/features/almacenes/hooks/useAlmacenes';

interface QuickProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickProductDialog({ open, onOpenChange }: QuickProductDialogProps) {
  const queryClient = useQueryClient();
  const { data: almacenes = [] } = useAlmacenes();
  const [name, setName] = useState('');
  const [precioPublico, setPrecioPublico] = useState('');
  const [precioProveedor, setPrecioProveedor] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [stock, setStock] = useState('1');
  const [saving, setSaving] = useState(false);

  function reset() {
    setName('');
    setPrecioPublico('');
    setPrecioProveedor('');
    setStock('1');
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    const pub = parseFloat(precioPublico) || 0;
    const prov = parseFloat(precioProveedor) || 0;
    if (pub <= 0 && prov <= 0) {
      toast.error('Ingresa al menos un precio');
      return;
    }

    setSaving(true);

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const generatedSku = `DAR-${Date.now().toString(36).toUpperCase()}`;
    const basePrice = pub > 0 ? pub : prov;

    // 1. Create product
    const { data: product, error } = (await supabase
      .from('products' as never)
      .insert({
        name: name.trim(),
        slug: `${slug}-${Date.now()}`,
        sku: generatedSku,
        base_price: basePrice,
        precio_mayoreo: prov,
        product_type: 'physical',
        is_active: true,
        track_stock: true,
        tax_rate: 0,
      } as never)
      .select('id')
      .single()) as unknown as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (error || !product) {
      toast.error(`Error: ${error?.message ?? 'No se pudo crear'}`);
      setSaving(false);
      return;
    }

    // 2. Create default variant
    const { data: variant } = (await supabase
      .from('product_variants' as never)
      .insert({
        product_id: product.id,
        sku: generatedSku,
        stock: parseInt(stock) || 1,
        is_active: true,
      } as never)
      .select('id')
      .single()) as unknown as { data: { id: string } | null };

    // 3. Set almacen stock + prices if almacen selected
    const targetAlmacen = almacenId || almacenes[0]?.id;
    if (targetAlmacen && variant) {
      await supabase
        .from('almacen_stock' as never)
        .upsert({
          almacen_id: targetAlmacen,
          variant_id: variant.id,
          stock: parseInt(stock) || 1,
        }, { onConflict: 'almacen_id,variant_id' } as never);

      if (pub > 0 || prov > 0) {
        await supabase
          .from('almacen_precios' as never)
          .upsert({
            almacen_id: targetAlmacen,
            product_id: product.id,
            precio_publico: pub,
            precio_proveedores: prov,
          }, { onConflict: 'almacen_id,product_id' } as never);
      }
    }

    toast.success(`"${name.trim()}" creado con ${stock} en inventario`);
    void queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    void queryClient.invalidateQueries({ queryKey: ['pos-almacen-stock-map'] });
    void queryClient.invalidateQueries({ queryKey: ['pos-almacen-prices'] });
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
            Crea un producto listo para vender
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: POLLO ENTERO 2.5kg"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Precio Publico</label>
              <Input
                type="number"
                value={precioPublico}
                onChange={(e) => setPrecioPublico(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Precio Proveedor</label>
              <Input
                type="number"
                value={precioProveedor}
                onChange={(e) => setPrecioProveedor(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Punto de Venta</label>
              <Select value={almacenId} onValueChange={setAlmacenId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {almacenes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cantidad</label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min={1}
              />
            </div>
          </div>
          <Button
            className="h-11 w-full bg-teal-600 hover:bg-teal-700"
            onClick={handleCreate}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Creando...' : 'Crear Producto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
