import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Ticket, Hash, Save, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import type { PvcntlRow } from '../hooks/useSettings';
import { EMPTY_CONFIG } from '../hooks/useSettings';

interface SettingsFormProps {
  initialData: PvcntlRow | undefined;
  saving: boolean;
  onSave: (config: PvcntlRow) => void;
}

export function SettingsForm({ initialData, saving, onSave }: SettingsFormProps) {
  const [config, setConfig] = useState<PvcntlRow>(EMPTY_CONFIG);

  useEffect(() => {
    if (initialData) {
      setConfig({
        empresa: initialData.empresa ?? '',
        lin1: initialData.lin1 ?? '',
        lin2: initialData.lin2 ?? '',
        lin3: initialData.lin3 ?? '',
        lin4: initialData.lin4 ?? '',
        lin5: initialData.lin5 ?? '',
        lin6: initialData.lin6 ?? '',
        lin7: initialData.lin7 ?? '',
        logoemp: initialData.logoemp ?? '',
        foliotkt: initialData.foliotkt ?? 0,
        foliocor: initialData.foliocor ?? 0,
        foliomvt: initialData.foliomvt ?? 0,
        usadmon: initialData.usadmon ?? null,
        usaventa: initialData.usaventa ?? null,
        ultclt: initialData.ultclt ?? null,
        modo_seguro_t: initialData.modo_seguro_t ?? false,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  const updateField = <K extends keyof PvcntlRow>(key: K, value: PvcntlRow[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const lineNumbers = [1, 2, 3, 4, 5, 6, 7] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Company identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" /> Identidad de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="empresa">Nombre de la Empresa</Label>
              <Input
                id="empresa"
                value={config.empresa}
                onChange={(e) => updateField('empresa', e.target.value)}
                placeholder="DAR Alimento"
              />
            </div>
            <div className="space-y-2">
              <Label>Logotipo</Label>
              <ImageUpload
                value={config.logoemp || null}
                onChange={(url) => updateField('logoemp', url ?? '')}
                bucket="logos"
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt lines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ticket className="h-5 w-5 text-primary" /> Texto del Ticket
            </CardTitle>
            <CardDescription>
              Líneas personalizadas que aparecen en el recibo impreso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineNumbers.map((num) => {
              const key = `lin${num}` as keyof PvcntlRow;
              return (
                <div key={num} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Línea {num}
                  </Label>
                  <Input
                    value={config[key] as string}
                    onChange={(e) => updateField(key, e.target.value as never)}
                    className="h-9 text-sm"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Folio numbering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5 text-primary" /> Folios y Series
          </CardTitle>
          <CardDescription>
            Numeración consecutiva para tickets de venta y cortes de caja
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-lg bg-muted/50 p-4">
            <h3 className="font-semibold">Tickets de Venta</h3>
            <div className="space-y-2">
              <Label>Último Folio</Label>
              <Input
                type="number"
                value={config.foliotkt}
                onChange={(e) =>
                  updateField('foliotkt', parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>
          <div className="space-y-4 rounded-lg bg-muted/50 p-4">
            <h3 className="font-semibold">Cortes de Caja</h3>
            <div className="space-y-2">
              <Label>Último Folio</Label>
              <Input
                type="number"
                value={config.foliocor}
                onChange={(e) =>
                  updateField('foliocor', parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>
          <div className="space-y-4 rounded-lg bg-muted/50 p-4">
            <h3 className="font-semibold">Movimientos de Inventario</h3>
            <div className="space-y-2">
              <Label>Último Folio</Label>
              <Input
                type="number"
                value={config.foliomvt}
                onChange={(e) =>
                  updateField('foliomvt', parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>


      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="gap-2 px-8">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar Configuración
        </Button>
      </div>
    </form>
  );
}
