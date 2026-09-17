"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarCog, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ErrorState, errorMessage } from "@/components/error-state";
import { MeetingTypeFormDialog } from "@/components/settings/meeting-type-form-dialog";
import { DomainTabSkeleton } from "@/components/settings/settings-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refreshMeetingTypes } from "@/hooks/use-meeting-types";
import { deleteMeetingType, listMeetingTypes, reorderMeetingTypes } from "@/lib/api/domain";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MeetingType } from "@/types/api";

interface MeetingTypesTabProps {
  /** Everyone may read the list; only `canManageSettings` roles may change it. */
  readOnly?: boolean;
}

interface SortableTypeRowProps {
  meetingType: MeetingType;
  readOnly: boolean;
  onEdit: (meetingType: MeetingType) => void;
  onDelete: (meetingType: MeetingType) => void;
}

function SortableTypeRow({ meetingType, readOnly, onEdit, onDelete }: SortableTypeRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: meetingType.id,
    disabled: readOnly,
  });

  const inUse = (meetingType.meetingCount ?? 0) > 0;

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "relative z-10 bg-accent shadow-sm")}
    >
      {readOnly ? null : (
        <TableCell className="w-[52px] pr-0">
          {/* The handle carries the drag listeners, not the row: otherwise every
              click on Editar or Remover would be interpreted as the start of a
              drag. dnd-kit's keyboard sensor makes this button work with Space
              + arrows, so reordering never requires a mouse. */}
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab touch-none active:cursor-grabbing"
            aria-label={`Reordenar ${meetingType.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4 text-muted-foreground" />
          </Button>
        </TableCell>
      )}

      <TableCell className="font-medium">{meetingType.name}</TableCell>

      <TableCell>
        <span className="flex items-center gap-2">
          {/* Congregation data, not chrome — applied inline on purpose. */}
          <span
            aria-hidden="true"
            className="size-4 shrink-0 rounded-full border"
            style={{ backgroundColor: meetingType.color ?? "var(--chart-1)" }}
          />
          <span className="font-mono text-xs text-muted-foreground uppercase">
            {meetingType.color ?? "—"}
          </span>
        </span>
      </TableCell>

      <TableCell>
        <Badge variant={meetingType.active ? "secondary" : "outline"}>
          {meetingType.active ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>

      <TableCell className="tabular-nums text-muted-foreground">
        {formatNumber(meetingType.meetingCount ?? 0)}
      </TableCell>

      {readOnly ? null : (
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${meetingType.name}`}
              onClick={() => onEdit(meetingType)}
            >
              <Pencil className="size-4" />
            </Button>

            {inUse ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* A disabled button fires no pointer events, so the span is
                      what the tooltip can attach to. */}
                  <span className="inline-flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      aria-label={`Não é possível remover ${meetingType.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {formatNumber(meetingType.meetingCount ?? 0)} culto(s) usam este tipo. Desative-o
                  em vez de removê-lo.
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${meetingType.name}`}
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(meetingType)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

export function MeetingTypesTab({ readOnly = false }: MeetingTypesTabProps) {
  const [types, setTypes] = useState<MeetingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MeetingType | null>(null);

  const sensors = useSensors(
    // A few pixels of slop before a drag starts, so a plain click on the handle
    // still behaves like a click instead of a zero-distance drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Inactive types are managed from here, so they have to be visible here.
      setTypes(await listMeetingTypes({ includeInactive: true }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Keeps the pickers elsewhere in the app in step with what was just changed. */
  async function reload() {
    await Promise.all([load(), refreshMeetingTypes()]);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = types.findIndex((type) => type.id === active.id);
    const newIndex = types.findIndex((type) => type.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = types;
    const reordered = arrayMove(types, oldIndex, newIndex);

    // Optimistic: the row follows the pointer, so snapping back while a request
    // flies would look broken. On failure the previous order is restored.
    setTypes(reordered);
    setSavingOrder(true);
    try {
      setTypes(await reorderMeetingTypes(reordered.map((type) => type.id)));
      await refreshMeetingTypes();
    } catch (err) {
      setTypes(previous);
      toast.error(errorMessage(err));
    } finally {
      setSavingOrder(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(meetingType: MeetingType) {
    setEditing(meetingType);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMeetingType(deleteTarget.id);
      toast.success("Tipo de culto removido.");
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      // A type still in use answers 409 with a message explaining how many
      // meetings block the removal — far more useful than a generic failure.
      toast.error(errorMessage(err));
    }
  }

  const nextSortOrder =
    types.length === 0 ? 0 : Math.max(...types.map((type) => type.sortOrder)) + 1;

  const createButton = readOnly ? null : (
    <Button onClick={openCreate} className="w-full sm:w-auto">
      <Plus className="size-4" aria-hidden="true" />
      Novo tipo
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Os tipos de culto são a lista que aparece ao registrar um culto e o que permite quebrar as
          métricas por tipo de encontro.
          {readOnly ? null : " Arraste pela alça para definir a ordem em que aparecem."}
        </p>
        {createButton}
      </div>

      {loading ? <DomainTabSkeleton /> : null}

      {!loading && error ? (
        <Card className="py-0">
          <CardContent className="p-0">
            <ErrorState
              error={error}
              onRetry={() => void load()}
              title="Não foi possível carregar os tipos de culto"
            />
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && types.length === 0 ? (
        <Card className="py-0">
          <CardContent className="p-0">
            <EmptyState
              icon={CalendarCog}
              title="Nenhum tipo de culto cadastrado"
              description="Sem ao menos um tipo não é possível registrar cultos — e são eles que permitem às métricas separar a presença por tipo de encontro."
            >
              {createButton}
            </EmptyState>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && types.length > 0 ? (
        <Card>
          <CardContent className={cn("px-0", savingOrder && "opacity-70 transition-opacity")}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={(event) => void handleDragEnd(event)}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    {readOnly ? null : <TableHead className="w-[52px]" />}
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[140px]">Cor</TableHead>
                    <TableHead className="w-[120px]">Situação</TableHead>
                    <TableHead className="w-[110px]">Cultos</TableHead>
                    {readOnly ? null : <TableHead className="w-[110px] text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={types.map((type) => type.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {types.map((type) => (
                      <SortableTypeRow
                        key={type.id}
                        meetingType={type}
                        readOnly={readOnly}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </CardContent>
        </Card>
      ) : null}

      {readOnly ? null : (
        <MeetingTypeFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          meetingType={editing}
          nextSortOrder={nextSortOrder}
          onSaved={() => void reload()}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Remover tipo de culto"
        description={
          <>
            <strong className="text-foreground">{deleteTarget?.name}</strong> deixará de aparecer ao
            registrar um culto. Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Remover"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
