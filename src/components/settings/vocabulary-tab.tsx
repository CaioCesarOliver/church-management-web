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
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ErrorState, errorMessage } from "@/components/error-state";
import { DomainTabSkeleton } from "@/components/settings/settings-skeletons";
import {
  VocabularyFormDialog,
  type VocabularyCopy,
  type VocabularyItem,
} from "@/components/settings/vocabulary-form-dialog";
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
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Uma coluna a mais, entre a situação e as ações. */
export interface VocabularyColumn<T> {
  header: string;
  /** Largura fixa: sem ela a coluna encolhe e o número quebra em duas linhas. */
  width: string;
  cell: (item: T) => ReactNode;
}

export interface VocabularyTabProps<T extends VocabularyItem> {
  /** Todo mundo lê a lista; só quem administra pode alterá-la. */
  readOnly?: boolean;
  icon: LucideIcon;
  /** Texto explicativo no topo, antes do botão de criar. */
  description: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  createButtonLabel: string;
  errorTitle: string;
  deleteTitle: string;
  deleteDescription: (item: T) => ReactNode;
  copy: VocabularyCopy;
  /** Quantos registros dependem do item — bloqueia a exclusão quando > 0. */
  usageCount: (item: T) => number;
  usageColumn: VocabularyColumn<T>;
  /** Explica no tooltip por que o botão de remover está desabilitado. */
  blockedHint: (item: T) => string;
  extraColumns?: VocabularyColumn<T>[];
  list: () => Promise<T[]>;
  create: (input: { name: string; active: boolean }) => Promise<unknown>;
  update: (id: string, input: { name: string; active: boolean }) => Promise<unknown>;
  remove: (id: string) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<T[]>;
  /** Mantém em dia qualquer seletor da aplicação que use esta lista. */
  onChanged?: () => Promise<void> | void;
}

interface SortableRowProps<T extends VocabularyItem> {
  item: T;
  readOnly: boolean;
  columns: VocabularyColumn<T>[];
  canDelete: boolean;
  blockedHint: string;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}

function SortableRow<T extends VocabularyItem>({
  item,
  readOnly,
  columns,
  canDelete,
  blockedHint,
  onEdit,
  onDelete,
}: SortableRowProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: readOnly,
  });

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "bg-accent relative z-10 shadow-sm")}
    >
      {readOnly ? null : (
        <TableCell className="w-[52px] pr-0">
          {/* A alça carrega os listeners, não a linha: senão todo clique em
              Editar ou Remover viraria início de arrasto. O sensor de teclado
              do dnd-kit faz este botão funcionar com Espaço + setas, então
              reordenar nunca exige mouse. */}
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab touch-none active:cursor-grabbing"
            aria-label={`Reordenar ${item.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="text-muted-foreground size-4" />
          </Button>
        </TableCell>
      )}

      <TableCell className="font-medium">{item.name}</TableCell>

      <TableCell>
        <Badge variant={item.active ? "secondary" : "outline"}>
          {item.active ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>

      {columns.map((column) => (
        <TableCell key={column.header} className="text-muted-foreground tabular-nums">
          {column.cell(item)}
        </TableCell>
      ))}

      {readOnly ? null : (
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${item.name}`}
              onClick={() => onEdit(item)}
            >
              <Pencil className="size-4" />
            </Button>

            {canDelete ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${item.name}`}
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Um botão desabilitado não dispara evento de ponteiro, então
                      o span é o que o tooltip consegue ancorar. */}
                  <span className="inline-flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      aria-label={`Não é possível remover ${item.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left">{blockedHint}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

/**
 * Lista da congregação com nome, situação, contagem de uso e ordem arrastável.
 *
 * Existe como componente único porque Cargos e Departamentos são a MESMA tela
 * com palavras diferentes. Dois arquivos de trezentas linhas quase idênticas
 * divergem no primeiro ajuste que alguém fizer em só um deles — e o jeito de
 * descobrir é um usuário reclamando que numa tela dá para arrastar e na outra
 * não.
 */
export function VocabularyTab<T extends VocabularyItem>({
  readOnly = false,
  icon,
  description,
  emptyTitle,
  emptyDescription,
  createButtonLabel,
  errorTitle,
  deleteTitle,
  deleteDescription,
  copy,
  usageCount,
  usageColumn,
  blockedHint,
  extraColumns = [],
  list,
  create,
  update,
  remove,
  reorder,
  onChanged,
}: VocabularyTabProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const sensors = useSensors(
    // Alguns pixels de folga antes de começar o arrasto, para um clique simples
    // na alça continuar sendo clique em vez de um arrasto de distância zero.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Os inativos são administrados a partir daqui, então precisam aparecer aqui.
      setItems(await list());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(async () => {
    await Promise.all([load(), onChanged?.()]);
  }, [load, onChanged]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = items;
    const reordered = arrayMove(items, oldIndex, newIndex);

    // Otimista: a linha acompanha o ponteiro, então voltar ao lugar enquanto a
    // requisição viaja pareceria defeito. Se falhar, a ordem anterior volta.
    setItems(reordered);
    setSavingOrder(true);
    try {
      setItems(await reorder(reordered.map((item) => item.id)));
      await onChanged?.();
    } catch (err) {
      setItems(previous);
      toast.error(errorMessage(err));
    } finally {
      setSavingOrder(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      toast.success(`${copy.noun.charAt(0).toUpperCase()}${copy.noun.slice(1)} removido.`);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      // Um item ainda em uso responde 409 com a contagem de quem o bloqueia —
      // bem mais útil do que uma falha genérica.
      toast.error(errorMessage(err));
    }
  }

  const columns = [...extraColumns, usageColumn];

  const createButton = readOnly ? null : (
    <Button
      onClick={() => {
        setEditing(null);
        setFormOpen(true);
      }}
      className="w-full sm:w-auto"
    >
      <Plus className="size-4" aria-hidden="true" />
      {createButtonLabel}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {description}
          {readOnly ? null : " Arraste pela alça para definir a ordem em que aparecem."}
        </p>
        {createButton}
      </div>

      {loading ? <DomainTabSkeleton /> : null}

      {!loading && error ? (
        <Card className="py-0">
          <CardContent className="p-0">
            <ErrorState error={error} onRetry={() => void load()} title={errorTitle} />
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <Card className="py-0">
          <CardContent className="p-0">
            <EmptyState icon={icon} title={emptyTitle} description={emptyDescription}>
              {createButton}
            </EmptyState>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && items.length > 0 ? (
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
                    <TableHead className="w-[120px]">Situação</TableHead>
                    {columns.map((column) => (
                      <TableHead key={column.header} className={column.width}>
                        {column.header}
                      </TableHead>
                    ))}
                    {readOnly ? null : (
                      <TableHead className="w-[110px] text-right">Ações</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((item) => (
                      <SortableRow
                        key={item.id}
                        item={item}
                        readOnly={readOnly}
                        columns={columns}
                        canDelete={usageCount(item) === 0}
                        blockedHint={blockedHint(item)}
                        onEdit={(target) => {
                          setEditing(target);
                          setFormOpen(true);
                        }}
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
        <VocabularyFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          item={editing}
          copy={copy}
          onCreate={create}
          onUpdate={update}
          onSaved={() => void reload()}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={deleteTitle}
        description={deleteTarget ? deleteDescription(deleteTarget) : null}
        confirmLabel="Remover"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

/** Célula de contagem padrão, formatada com separador de milhar. */
export function countCell(value: number): ReactNode {
  return formatNumber(value);
}
