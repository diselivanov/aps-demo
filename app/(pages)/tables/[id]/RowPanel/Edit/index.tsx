"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useAlert } from "@/components/ui/Alert";
import Files from "./Files";
import FieldInput, { type FieldValueMap } from "./FieldInput";
import styles from "./index.module.css";

type Field = {
  id: number;
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  order: number;
};

type RowValue = {
  fieldId: number;
  valueString: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  order: number;
};

type RowValuePayload = {
  fieldId: number;
  valueString?: string;
  valueNumber?: number;
  valueDate?: string;
  order: number;
};

type Props = {
  mode: "create" | "edit";
  tableId: number;
  rowId?: number;
  fields: Field[];
  initial?: RowValue[];
  onClose: () => void;
  onSaved: () => void;
  onCancel?: () => void;
};

export default function Edit({
  mode,
  tableId,
  rowId,
  fields,
  initial = [],
  onClose,
  onSaved,
  onCancel,
}: Props) {
  const { show } = useAlert();
  const [submitting, setSubmitting] = useState(false);

  const buildInitial = (): FieldValueMap => {
    const map: FieldValueMap = {};
    for (const field of fields) {
      const vals = initial.filter((v) => v.fieldId === field.id);
      if (vals.length === 0) continue;

      if (field.type === "MULTI_SELECT") {
        map[field.id] = vals
          .sort((a, b) => a.order - b.order)
          .map((v) => v.valueString ?? "")
          .filter(Boolean);
      } else {
        const v = vals[0];
        if (field.type === "NUMBER") {
          map[field.id] = v.valueNumber != null ? String(v.valueNumber) : "";
        } else if (field.type === "DATE") {
          map[field.id] = v.valueDate ? v.valueDate.slice(0, 10) : "";
        } else {
          map[field.id] = v.valueString ?? "";
        }
      }
    }
    return map;
  };

  const [values, setValues] = useState<FieldValueMap>(buildInitial);

  const submit = async () => {
    const payload: RowValuePayload[] = fields.flatMap(
      (field): RowValuePayload[] => {
        if (field.type === "FILE") return [];

        const value = values[field.id];
        if (value === undefined || value === null || value === "") return [];

        if (field.type === "MULTI_SELECT" && Array.isArray(value)) {
          return value.map((v, index) => ({
            fieldId: field.id,
            valueString: v,
            order: index,
          }));
        }

        if (field.type === "NUMBER") {
          return [{ fieldId: field.id, valueNumber: Number(value), order: 0 }];
        }
        if (field.type === "DATE") {
          return [{ fieldId: field.id, valueDate: String(value), order: 0 }];
        }
        return [{ fieldId: field.id, valueString: String(value), order: 0 }];
      },
    );

    setSubmitting(true);

    const url =
      mode === "create"
        ? `/api/tables/${tableId}/rows`
        : `/api/tables/${tableId}/rows/${rowId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: payload }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      return;
    }

    if (mode === "create") {
      show({ type: "success", message: "Создано" });
      onClose();
    } else {
      show({ type: "success", message: "Сохранено" });
    }
    onSaved();
  };

  const dataFields = fields.filter((f) => f.type !== "FILE");
  const fileFields = fields.filter((f) => f.type === "FILE");

  return (
    <form
      className={styles.wrap}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className={styles.block}>
        <span className={styles.blockTitle}>Данные</span>
        <div className={styles.fields}>
          {dataFields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={(value) =>
                setValues((prev) => ({ ...prev, [field.id]: value }))
              }
            />
          ))}
        </div>
      </div>

      {mode === "edit" &&
        fileFields.map((field) => (
          <Files
            key={field.id}
            tableId={tableId}
            rowId={rowId ?? null}
            field={field}
            onChanged={onSaved}
          />
        ))}

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => (onCancel ? onCancel() : onClose())}
        >
          Отмена
        </Button>
        <Button type="submit" disabled={submitting}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
