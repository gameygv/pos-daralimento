import { useState } from 'react';
import { Search, UserPlus, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCustomers, useCreateCustomer, type ClienteRow } from '@/features/customers/hooks/useCustomers';
import type { SelectedClient } from '../hooks/useCart';

interface ClientSelectorProps {
  selectedClient: SelectedClient | null;
  onSelectClient: (client: SelectedClient | null) => void;
}

export function ClientSelector({ selectedClient, onSelectClient }: ClientSelectorProps) {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPhone2, setNewPhone2] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDireccion, setNewDireccion] = useState('');
  const [newRfc, setNewRfc] = useState('');

  const { data: customers = [] } = useCustomers(search || null);
  const createCustomer = useCreateCustomer();

  function handleSelectMostrador() {
    onSelectClient(null);
  }

  function handleSelectCustomer(customer: ClienteRow) {
    onSelectClient({
      id: customer.id,
      nombre: customer.nombre,
      direccion: customer.direccion,
      telefono: customer.telefono,
      telefono2: customer.telefono2,
      email: customer.email,
      rfc: customer.rfc,
    });
    setSearch('');
  }

  async function handleCreateCustomer() {
    if (!newName.trim()) return;
    const result = await createCustomer.mutateAsync({
      nombre: newName.trim(),
      telefono: newPhone.trim() || null,
      telefono2: newPhone2.trim() || null,
      email: newEmail.trim() || null,
      direccion: newDireccion.trim() || null,
      rfc: newRfc.trim() || null,
      saldo: 0,
    });
    if (result) {
      onSelectClient({
        id: result.id,
        nombre: result.nombre,
        direccion: result.direccion,
        telefono: result.telefono,
        telefono2: result.telefono2,
        email: result.email,
        rfc: result.rfc,
      });
    }
    setNewName('');
    setNewPhone('');
    setNewPhone2('');
    setNewEmail('');
    setNewDireccion('');
    setNewRfc('');
    setShowCreateForm(false);
  }

  const displayName = selectedClient?.nombre ?? 'Mostrador';

  return (
    <div className="flex flex-1 flex-col p-3">
      {/* Current selection */}
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-teal-50 p-3">
        <UserCheck className="h-5 w-5 text-teal-600" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-teal-600">Cliente seleccionado</p>
          <p className="truncate text-sm font-semibold text-teal-800">{displayName}</p>
        </div>
        {selectedClient && (
          <button
            onClick={handleSelectMostrador}
            className="rounded p-1 text-teal-600 hover:bg-teal-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mostrador quick-select */}
      <Button
        variant={selectedClient === null ? 'default' : 'outline'}
        size="sm"
        className="mb-3 w-full"
        onClick={handleSelectMostrador}
      >
        Mostrador (Publico General)
      </Button>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customer list */}
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {customers
            .filter((c) => c.nombre !== 'Mostrador')
            .map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleSelectCustomer(customer)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                selectedClient?.id === customer.id ? 'bg-teal-50 text-teal-700' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{customer.nombre}</p>
                {customer.telefono && (
                  <p className="truncate text-xs text-gray-500">{customer.telefono}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* New customer */}
      {showCreateForm ? (
        <div className="mt-3 space-y-2 rounded-lg border p-3">
          <p className="text-sm font-medium">Nuevo Cliente</p>
          <Input
            placeholder="Nombre *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            placeholder="Telefono"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <Input
            placeholder="Telefono 2"
            value={newPhone2}
            onChange={(e) => setNewPhone2(e.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Input
            placeholder="RFC"
            value={newRfc}
            onChange={(e) => setNewRfc(e.target.value.toUpperCase())}
            maxLength={13}
          />
          <Input
            placeholder="Direccion"
            value={newDireccion}
            onChange={(e) => setNewDireccion(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowCreateForm(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleCreateCustomer}
              disabled={!newName.trim() || createCustomer.isPending}
            >
              {createCustomer.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setShowCreateForm(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      )}
    </div>
  );
}
