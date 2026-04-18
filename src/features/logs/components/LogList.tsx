import { useState } from 'react';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLogs } from '../hooks/useLogs';

export function LogList() {
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: logs = [], isLoading } = useLogs(actionFilter || null);

  function formatTimestamp(ts: string): string {
    return new Date(ts).toLocaleString('es-MX');
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando logs...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Filtrar por acción..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <FileText className="mx-auto mb-2 h-8 w-8" />
          <p>No hay registros de auditoría</p>
          <p className="mt-1 text-sm">
            Los registros aparecerán aquí conforme se generen eventos en el
            sistema.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <>
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.details && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setExpandedId(
                              expandedId === log.id ? null : log.id,
                            )
                          }
                        >
                          {expandedId === log.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatTimestamp(log.created_at)}
                    </TableCell>
                    <TableCell>{log.user_email ?? log.user_id ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground text-sm">
                      {log.details
                        ? JSON.stringify(log.details).slice(0, 100)
                        : '—'}
                    </TableCell>
                  </TableRow>
                  {expandedId === log.id && log.details && (
                    <TableRow key={`${log.id}-details`}>
                      <TableCell colSpan={5}>
                        <pre className="max-h-[300px] overflow-auto rounded bg-muted p-3 text-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
