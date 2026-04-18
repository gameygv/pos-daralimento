import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useOptionGroups,
  useCreateOptionGroup,
  useUpdateOptionGroup,
  useDeleteOptionGroup,
  useCreateOptionValue,
  useDeleteOptionValue,
} from '../hooks/useOptionGroups';

export function OptionGroupManager() {
  const { data: groups = [], isLoading } = useOptionGroups();
  const createGroup = useCreateOptionGroup();
  const updateGroup = useUpdateOptionGroup();
  const deleteGroup = useDeleteOptionGroup();
  const createValue = useCreateOptionValue();
  const deleteValue = useDeleteOptionValue();

  const [newGroupName, setNewGroupName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});

  function toggleExpand(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  async function handleCreateGroup() {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    await createGroup.mutateAsync({ name: trimmed });
    setNewGroupName('');
  }

  async function handleUpdateGroup(id: string) {
    const trimmed = editingGroupName.trim();
    if (!trimmed) return;
    await updateGroup.mutateAsync({ id, name: trimmed });
    setEditingGroupId(null);
    setEditingGroupName('');
  }

  async function handleDeleteGroup(id: string) {
    await deleteGroup.mutateAsync(id);
  }

  async function handleCreateValue(groupId: string) {
    const trimmed = (newValueInputs[groupId] ?? '').trim();
    if (!trimmed) return;
    await createValue.mutateAsync({ group_id: groupId, value: trimmed });
    setNewValueInputs((prev) => ({ ...prev, [groupId]: '' }));
  }

  async function handleDeleteValue(valueId: string) {
    await deleteValue.mutateAsync(valueId);
  }

  function startEditing(groupId: string, currentName: string) {
    setEditingGroupId(groupId);
    setEditingGroupName(currentName);
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando grupos de opciones...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Grupos de Opciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add new group */}
          <div className="flex gap-2">
            <Input
              placeholder="Nuevo grupo (ej: Tamano, Color)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleCreateGroup();
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => void handleCreateGroup()}
              disabled={!newGroupName.trim() || createGroup.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>

          {/* Group list */}
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay grupos de opciones
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                const isEditing = editingGroupId === group.id;

                return (
                  <div key={group.id} className="border rounded-lg">
                    {/* Group header */}
                    <div className="flex items-center gap-2 p-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleExpand(group.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>

                      {isEditing ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            className="h-7 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void handleUpdateGroup(group.id);
                              if (e.key === 'Escape') setEditingGroupId(null);
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => void handleUpdateGroup(group.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setEditingGroupId(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium flex-1">{group.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {group.values.length} valor{group.values.length !== 1 ? 'es' : ''}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => startEditing(group.id, group.name)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => void handleDeleteGroup(group.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Values (expanded) */}
                    {isExpanded && (
                      <div className="border-t px-3 py-2 space-y-2 bg-muted/30">
                        {group.values.map((val) => (
                          <div key={val.id} className="flex items-center gap-2">
                            <span className="text-sm flex-1 pl-8">{val.value}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => void handleDeleteValue(val.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2 pl-8">
                          <Input
                            placeholder="Nuevo valor"
                            value={newValueInputs[group.id] ?? ''}
                            onChange={(e) =>
                              setNewValueInputs((prev) => ({
                                ...prev,
                                [group.id]: e.target.value,
                              }))
                            }
                            className="h-7 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                void handleCreateValue(group.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => void handleCreateValue(group.id)}
                            disabled={!(newValueInputs[group.id] ?? '').trim()}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
