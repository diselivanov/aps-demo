"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import Select from "@/components/ui/Select";
import styles from "./index.module.css";

export type FieldType =
  | "STRING"
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "MULTI_SELECT"
  | "FILE";

export type FieldDraft = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
};

type Props = {
  field: FieldDraft;
  onChange: (patch: Partial<FieldDraft>) => void;
  onRemove: () => void;
  overlay?: boolean;
};

const TYPE_OPTIONS = [
  { value: "STRING", label: "Строка" },
  { value: "TEXT", label: "Текст" },
  { value: "NUMBER", label: "Число" },
  { value: "DATE", label: "Дата" },
  { value: "SELECT", label: "Список" },
  { value: "MULTI_SELECT", label: "Мульти-список" },
  { value: "FILE", label: "Файл" },
];

const REQUIRED_OPTIONS = [
  { value: "false", label: "Необязательное" },
  { value: "true", label: "Обязательное" },
];

export default function FieldRow({
  field,
  onChange,
  onRemove,
  overlay,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id, disabled: overlay });

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      };

  const hasOptions = field.type === "SELECT" || field.type === "MULTI_SELECT";

  return (
    <div
      className={`${styles.wrap} ${overlay ? styles.overlay : ""}`}
      ref={overlay ? undefined : setNodeRef}
      style={style}
    >
      <div className={styles.row}>
        <button
          type="button"
          className={styles.drag}
          {...(overlay ? {} : attributes)}
          {...(overlay ? {} : listeners)}
          aria-label="Переместить"
        >
          <Icon name="grip" size={16} />
        </button>

        <Select
          label="Тип"
          value={field.type}
          options={TYPE_OPTIONS}
          onChange={(value) => onChange({ type: value as FieldType })}
        />

        <Input
          placeholder="Название поля"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
        />

        <Select
          label="Необходимость"
          value={String(field.required)}
          options={REQUIRED_OPTIONS}
          onChange={(value) => onChange({ required: value === "true" })}
        />

        <button
          type="button"
          className={styles.remove}
          onClick={onRemove}
          aria-label="Удалить поле"
        >
          <Icon name="cross" size={16} />
        </button>
      </div>

      {hasOptions && (
        <div className={styles.optionsRow}>
          <Input
            placeholder="Варианты через запятую"
            value={field.options.join(", ")}
            onChange={(e) =>
              onChange({
                options: e.target.value.split(",").map((s) => s.trim()),
              })
            }
          />
        </div>
      )}
    </div>
  );
}
