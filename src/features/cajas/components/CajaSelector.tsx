import { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveCajas, getStoredCajaId, setStoredCajaId, type CajaRow } from '../hooks/useCajas';

interface CajaSelectorProps {
  onCajaChange: (caja: CajaRow | null) => void;
}

export function CajaSelector({ onCajaChange }: CajaSelectorProps) {
  const { data: cajas = [] } = useActiveCajas();
  const [selectedId, setSelectedId] = useState<string>(() => getStoredCajaId() ?? '');

  // Auto-select first caja if none stored
  useEffect(() => {
    if (cajas.length > 0 && !selectedId) {
      const first = cajas[0];
      setSelectedId(first.id);
      setStoredCajaId(first.id);
      onCajaChange(first);
    } else if (cajas.length > 0 && selectedId) {
      const found = cajas.find((c) => c.id === selectedId);
      if (found) {
        onCajaChange(found);
      } else {
        // Stored caja no longer exists, select first
        const first = cajas[0];
        setSelectedId(first.id);
        setStoredCajaId(first.id);
        onCajaChange(first);
      }
    }
  }, [cajas]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(value: string) {
    setSelectedId(value);
    setStoredCajaId(value);
    const caja = cajas.find((c) => c.id === value) ?? null;
    onCajaChange(caja);
  }

  if (cajas.length === 0) {
    return (
      <span className="text-sm text-gray-400">Sin cajas</span>
    );
  }

  const selectedCaja = cajas.find((c) => c.id === selectedId);

  return (
    <div className="flex items-center gap-2">
      <Monitor className="h-4 w-4 text-gray-400" />
      <Select value={selectedId} onValueChange={handleChange}>
        <SelectTrigger className="h-8 w-[160px] border-gray-700 bg-gray-800 text-sm text-white">
          <SelectValue placeholder="Seleccionar caja">
            {selectedCaja?.nombre ?? 'Seleccionar caja'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {cajas.map((caja) => (
            <SelectItem key={caja.id} value={caja.id}>
              {caja.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
