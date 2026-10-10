"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useAlert } from "@/components/ui/Alert";
import styles from "./index.module.css";

type Field = {
  id: number;
  label: string;
  type: string;
};

type RowFile = {
  id: number;
  fieldId: number;
  name: string;
  mime: string;
  size: number;
  createdAt: string;
};

type Props = {
  tableId: number;
  rowId: number | null;
  field: Field;
  onChanged: () => void;
};

const MAX_FILES = 10;

export default function Files({ tableId, rowId, field, onChanged }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { show } = useAlert();
  const [files, setFiles] = useState<RowFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!rowId) return;
    const res = await fetch(`/api/tables/${tableId}/rows/${rowId}`);
    if (!res.ok) return;
    const json = await res.json();
    setFiles(
      (json.row.files ?? []).filter((f: RowFile) => f.fieldId === field.id),
    );
  }, [tableId, rowId, field.id]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (file: File) => {
    if (!rowId) return;
    setUploading(true);
    const form = new FormData();
    form.set("fieldId", String(field.id));
    form.append("file", file);

    const res = await fetch(`/api/tables/${tableId}/rows/${rowId}/files`, {
      method: "POST",
      body: form,
    });

    setUploading(false);

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка загрузки" });
      return;
    }

    load();
    onChanged();
  };

  const remove = async (fileId: number) => {
    if (!rowId) return;
    const res = await fetch(
      `/api/tables/${tableId}/rows/${rowId}/files/${fileId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      return;
    }
    load();
    onChanged();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  };

  const disabled = !rowId || files.length >= MAX_FILES;

  return (
    <div className={styles.block}>
      <span className={styles.blockTitle}>{field.label}</span>

      {rowId && files.length > 0 && (
        <div className={styles.list}>
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
                  <span className={styles.size}>{formatSize(file.size)}</span>
                </div>
              </a>
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(file.id)}
                aria-label="Удалить"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.xlsx"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      <Button
        type="button"
        variant="secondary"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        Загрузить файл
      </Button>

      {rowId && files.length >= MAX_FILES && (
        <p className={styles.hint}>Достигнут лимит файлов (10)</p>
      )}
    </div>
  );
}
