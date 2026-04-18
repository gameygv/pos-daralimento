import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, ShieldCheck, User } from 'lucide-react';
import type { VendeRow } from '../hooks/useUsers';

interface UserListProps {
  users: VendeRow[];
  onEdit: (user: VendeRow) => void;
  onDelete: (user: VendeRow) => void;
}

export function UserList({ users, onEdit, onDelete }: UserListProps) {
  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No hay usuarios registrados.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead className="text-center">Comisión</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => {
          const isAdmin = u.role === 'admin';
          return (
            <TableRow key={u.codven}>
              <TableCell className="font-mono text-xs">{u.codven}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  ) : (
                    <User className="h-4 w-4 text-emerald-500" />
                  )}
                  {u.nomv}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={isAdmin ? 'default' : 'secondary'}>
                  {isAdmin ? 'Admin' : 'Vendedor'}
                </Badge>
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {isAdmin ? '-' : `${u.comis}%`}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(u)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(u)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
