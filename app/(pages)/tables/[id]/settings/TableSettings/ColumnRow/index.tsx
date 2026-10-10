"use client";

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Icon from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import styles from "./index.module.css";

export type ColumnDraft = {
  id: string;
  fieldId: number;
  label: string;
  visible: boolean;
};

type Props = {
  column: ColumnDraft;
  onToggle: () => void;
  onRemove: () => void;
  onChangeLabel: (label: string) => void;
  overlay?: boolean;
};

export default function ColumnRow({
  column,
  onToggle,
  onRemove,
  onChangeLabel,
  overlay,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(column.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setValue(column.label);
  }, [column.label, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, disabled: overlay || editing });

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      };

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== column.label) onChangeLabel(trimmed);
    else setValue(column.label);
    setEditing(false);
  };

  const cancel = () => {
    setValue(column.label);
    setEditing(false);
  };

  return (
    <div
      className={`${styles.wrap} ${overlay ? styles.overlay : ""}`}
      ref={overlay ? undefined : setNodeRef}
      style={style}
    >
      <button
        type="button"
        className={styles.drag}
        {...(overlay ? {} : attributes)}
        {...(overlay ? {} : listeners)}
        aria-label="Переместить"
      >
        <Icon name="grip" size={16} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          onBlur={commit}
        />
      ) : (
        <div className={styles.body}>
          <button
            type="button"
            className={styles.checkboxBtn}
            onClick={onToggle}
            aria-label="Видимость"
          >
            <span
              className={`${styles.checkbox} ${
                column.visible ? styles.checkboxChecked : ""
              }`}
            >
              {column.visible && <Icon name="check" size={12} />}
            </span>
          </button>
          <span
            className={`${styles.label} ${
              !column.visible ? styles.labelHidden : ""
            }`}
          >
            {column.label}
          </span>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          onClick={() => setEditing(true)}
          aria-label="Редактировать"
        >
          <Icon name="edit" size={16} />
        </button>
        <button
          type="button"
          className={styles.action}
          onClick={onRemove}
          aria-label="Удалить"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
}
