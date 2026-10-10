"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAlert } from "@/components/ui/Alert";
import FieldRow, { type FieldDraft } from "./FieldRow";
import styles from "./index.module.css";

type FolderNode = {
  id: number;
  name: string;
  parentId: number | null;
};

const newField = (): FieldDraft => ({
  id: crypto.randomUUID(),
  label: "",
  type: "STRING",
  required: false,
  options: [],
});

export default function NewTableForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { show } = useAlert();

  const folderIdParam = searchParams.get("folderId");
  const folderId = folderIdParam ? Number(folderIdParam) : null;

  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [name, setName] = useState("");
  const [fields, setFields] = useState<FieldDraft[]>([newField()]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const loadFolders = useCallback(async () => {
    const res = await fetch("/api/folders");
    if (!res.ok) return;
    const json = await res.json();
    setFolders(json.folders ?? []);
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const breadcrumbs = (() => {
    const parts: string[] = ["Документы"];
    if (folderId) {
      const chain: string[] = [];
      let current = folders.find((f) => f.id === folderId);
      while (current) {
        chain.unshift(current.name);
        current = current.parentId
          ? folders.find((f) => f.id === current!.parentId)
          : undefined;
      }
      parts.push(...chain);
    }
    parts.push(name.trim() || "Новая таблица");
    return parts;
  })();

  const updateField = (id: string, patch: Partial<FieldDraft>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const addField = () => {
    setFields((prev) => [...prev, newField()]);
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id);
      const newIndex = prev.findIndex((f) => f.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const onDragCancel = () => setActiveId(null);

  const activeField = fields.find((f) => f.id === activeId);

  const submit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      show({ type: "error", message: "Введите название таблицы" });
      return;
    }

    const cleaned = fields.map((f) => ({
      label: f.label.trim(),
      type: f.type,
      required: f.required,
      options:
        f.type === "SELECT" || f.type === "MULTI_SELECT"
          ? f.options.map((o) => o.trim()).filter(Boolean)
          : undefined,
    }));

    if (cleaned.some((f) => !f.label)) {
      show({ type: "error", message: "Заполните названия полей" });
      return;
    }

    for (const f of cleaned) {
      if (
        (f.type === "SELECT" || f.type === "MULTI_SELECT") &&
        (!f.options || f.options.length === 0)
      ) {
        show({
          type: "error",
          message: `Укажите варианты для поля «${f.label}»`,
        });
        return;
      }
    }

    setSubmitting(true);
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName, folderId, fields: cleaned }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      setSubmitting(false);
      return;
    }

    const json = await res.json();
    window.location.href = `/tables/${json.table.id}`;
  };

  return (
    <FormWrapper
      title="Новая таблица"
      width="md"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className={styles.nameRow}>
        <Input
          placeholder="Название таблицы"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="button" variant="secondary" onClick={addField}>
          Добавить поле
        </Button>
      </div>

      <div className={styles.block}>
        <span className={styles.blockTitle}>Колонки</span>
        <DndContext
          id="table-fields"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.fields}>
              {fields.map((field) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  onChange={(patch) => updateField(field.id, patch)}
                  onRemove={() => removeField(field.id)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeField && (
              <FieldRow
                field={activeField}
                onChange={() => {}}
                onRemove={() => {}}
                overlay
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <div className={styles.submitRow}>
        <Button type="submit" disabled={submitting}>
          Создать таблицу
        </Button>
      </div>
    </FormWrapper>
  );
}
