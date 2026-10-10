"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useAlert } from "@/components/ui/Alert";
import Comments from "./Comments";
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

type RowFile = {
  id: number;
  fieldId: number;
  name: string;
  mime: string;
  size: number;
  createdAt: string;
};

type RowData = {
  id: number;
  tableId: number;
  createdAt: string;
  updatedAt: string;
  values: RowValue[];
  files: RowFile[];
  comments: unknown[];
};

type Props = {
  tableId: number;
  rowId: number;
  fields: Field[];
  onEdit: () => void;
  onSaved: () => void;
};

export default function View({ tableId, rowId, fields, onSaved }: Props) {
  const { show } = useAlert();
  const [row, setRow] = useState<RowData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tables/${tableId}/rows/${rowId}`);
    if (!res.ok) {
      show({ type: "error", message: "Запись не найдена" });
      return;
    }
    const json = await res.json();
    setRow(json.row);
    setLoading(false);
  }, [tableId, rowId, show]);

  useEffect(() => {
    load();
  }, [load]);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/tables/${tableId}/rows/${rowId}`);
    if (!res.ok) return;
    const json = await res.json();
    setRow(json.row);
    onSaved();
  }, [tableId, rowId, onSaved]);

  if (loading || !row) {
    return <div className={styles.empty}></div>;
  }

  const getValue = (field: Field) => {
    const vals = row.values.filter((v) => v.fieldId === field.id);
    if (vals.length === 0) return "";

    if (field.type === "MULTI_SELECT") {
      return vals
        .sort((a, b) => a.order - b.order)
        .map((v) => v.valueString)
        .filter(Boolean)
        .join(", ");
    }

    const v = vals[0];
    if (field.type === "NUMBER")
      return v.valueNumber != null ? String(v.valueNumber) : "";
    if (field.type === "DATE")
      return v.valueDate
        ? new Date(v.valueDate).toLocaleDateString("ru-RU")
        : "";
    return v.valueString ?? "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  };

  const dataFields = fields.filter((f) => f.type !== "FILE");
  const fileFields = fields.filter((f) => f.type === "FILE");

  return (
    <div className={styles.wrap}>
      <div className={styles.block}>
        <span className={styles.blockTitle}>Данные</span>
        {dataFields.map((field) => {
          const value = getValue(field);
          return (
            <div key={field.id} className={styles.field}>
              <span className={styles.label}>{field.label}</span>
              <span className={styles.value}>{value || "—"}</span>
            </div>
          );
        })}
      </div>

      {fileFields.map((field) => {
        const files = row.files.filter((f) => f.fieldId === field.id);
        if (files.length === 0) return null;
        return (
          <div key={field.id} className={styles.block}>
            <span className={styles.blockTitle}>{field.label}</span>
            <div className={styles.files}>
              {files.map((file) => (
                <div key={file.id} className={styles.file}>
                  <a
                    className={styles.link}
                    href={`/api/tables/${tableId}/rows/${rowId}/files/${file.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="file" size={16} className={styles.icon} />
                    <div className={styles.info}>
                      <span className={styles.name}>{file.name}</span>
                      <span className={styles.size}>
                        {formatSize(file.size)}
                      </span>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Comments tableId={tableId} rowId={rowId} onChanged={reload} />
    </div>
  );
}
