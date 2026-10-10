"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormWrapper from "@/components/ui/FormWrapper";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import { useAlert } from "@/components/ui/Alert";
import ColumnRow, { type ColumnDraft } from "./ColumnRow";
import styles from "./index.module.css";

type Field = {
  id: number;
  label: string;
  type: string;
  order: number;
};

type ColumnConfig = {
  fieldId: number;
  order: number;
  width: number;
};

export default function TableSettings({ tableId }: { tableId: number }) {
  const router = useRouter();
  const { show } = useAlert();

  const [name, setName] = useState("");
  const [columns, setColumns] = useState<ColumnDraft[]>([]);
  const [initialLabels, setInitialLabels] = useState<Record<number, string>>(
    {},
  );
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ColumnDraft | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const load = useCallback(async () => {
    const [tableRes, configRes] = await Promise.all([
      fetch(`/api/tables/${tableId}`),
      fetch(`/api/tables/${tableId}/config`),
    ]);

    if (!tableRes.ok || !configRes.ok) {
      show({ type: "error", message: "Таблица не найдена" });
      return;
    }

    const tableJson = await tableRes.json();
    const configJson = await configRes.json();

    setName(tableJson.table.name);

    const fields: Field[] = tableJson.table.fields;
    const cfg: ColumnConfig[] = configJson.config.columns ?? [];
    const visibleIds = new Set(cfg.map((c) => c.fieldId));

    const labels: Record<number, string> = {};
    for (const f of fields) labels[f.id] = f.label;
    setInitialLabels(labels);

    const all = fields
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((f) => ({
        id: crypto.randomUUID(),
        fieldId: f.id,
        label: f.label,
        visible: cfg.length === 0 ? true : visibleIds.has(f.id),
      }));

    const visible = cfg
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((c) => fields.find((f) => f.id === c.fieldId))
      .filter((f): f is Field => Boolean(f))
      .map((f) => ({
        id: crypto.randomUUID(),
        fieldId: f.id,
        label: f.label,
        visible: true,
      }));

    const hidden = all.filter((c) => !c.visible);

    setColumns([...visible, ...hidden]);
    setLoading(false);
  }, [tableId, show]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleVisible = (id: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)),
    );
  };

  const changeLabel = (col: ColumnDraft, label: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.fieldId === col.fieldId ? { ...c, label } : c)),
    );
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setColumns((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const onDragCancel = () => setActiveId(null);

  const activeColumn = columns.find((c) => c.id === activeId);

  const removeField = async (col: ColumnDraft) => {
    const res = await fetch(`/api/fields/${col.fieldId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      return;
    }
    setConfirmDelete(null);
    setColumns((prev) => prev.filter((c) => c.fieldId !== col.fieldId));
    show({ type: "success", message: "Удалено" });
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      show({ type: "error", message: "Введите название таблицы" });
      return;
    }

    setSaving(true);

    const nameRes = await fetch(`/api/tables/${tableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    if (!nameRes.ok) {
      const json = await nameRes.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      setSaving(false);
      return;
    }

    for (const col of columns) {
      const initial = initialLabels[col.fieldId];
      if (initial === undefined || initial === col.label) continue;
      const res = await fetch(`/api/fields/${col.fieldId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: col.label }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        show({ type: "error", message: json?.error ?? "Ошибка" });
        setSaving(false);
        return;
      }
    }

    const cfgRes = await fetch(`/api/tables/${tableId}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        columns: columns
          .filter((c) => c.visible)
          .map((c, i) => ({
            fieldId: c.fieldId,
            order: i,
            width: 160,
          })),
        pageSize,
      }),
    });
    setSaving(false);

    if (!cfgRes.ok) {
      const json = await cfgRes.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      return;
    }

    show({ type: "success", message: "Сохранено" });
  };

  if (loading) {
    return <div className={styles.empty}></div>;
  }

  return (
    <FormWrapper
      title="Настройки таблицы"
      width="md"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Input
        placeholder="Название таблицы"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className={styles.block}>
        <span className={styles.blockTitle}>Колонки</span>
        <DndContext
          id="table-columns"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.fields}>
              {columns.map((col) => (
                <ColumnRow
                  key={col.id}
                  column={col}
                  onToggle={() => toggleVisible(col.id)}
                  onRemove={() => setConfirmDelete(col)}
                  onChangeLabel={(label) => changeLabel(col, label)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeColumn && (
              <ColumnRow
                column={activeColumn}
                onToggle={() => {}}
                onRemove={() => {}}
                onChangeLabel={() => {}}
                overlay
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <div className={styles.submitRow}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/tables/${tableId}`)}
        >
          Назад к таблице
        </Button>
        <Button type="submit" disabled={saving}>
          Сохранить
        </Button>
      </div>

      <ConfirmActionModal
        open={confirmDelete !== null}
        title="Удаление столбца"
        description={
          confirmDelete
            ? `Столбец «${confirmDelete.label}» и все его значения будут удалены без возможности восстановления.`
            : ""
        }
        keyword={confirmDelete?.label ?? ""}
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && removeField(confirmDelete)}
      />
    </FormWrapper>
  );
}
