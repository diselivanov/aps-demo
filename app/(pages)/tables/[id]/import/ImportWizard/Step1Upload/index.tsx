"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useAlert } from "@/components/ui/Alert";
import styles from "./index.module.css";

export type ParsedCsv = {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
};

type Props = {
  onParsed: (data: ParsedCsv) => void;
  onCancel: () => void;
};

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 5000;

export default function Step1Upload({ onParsed, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { show } = useAlert();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const parseFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      show({ type: "error", message: "Только CSV" });
      return;
    }
    if (file.size > MAX_SIZE) {
      show({ type: "error", message: "Файл больше 10 МБ" });
      return;
    }

    setLoading(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
      transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
      complete: (result) => {
        setLoading(false);

        // критичные ошибки — когда вообще не удалось разобрать
        const fatal = result.errors.find(
          (e) =>
            e.code !== "TooFewFields" &&
            e.code !== "TooManyFields" &&
            e.code !== "UndetectableDelimiter",
        );
        if (fatal && !result.meta.fields?.length) {
          show({
            type: "error",
            message: `Ошибка CSV: ${fatal.message}`,
          });
          return;
        }

        const headers = (result.meta.fields ?? [])
          .map((h) => h.replace(/^\uFEFF/, "").trim())
          .filter(Boolean);

        if (headers.length === 0) {
          show({ type: "error", message: "Не найдены заголовки" });
          return;
        }

        const rows = result.data.filter((r) =>
          Object.values(r).some((v) => String(v ?? "").trim() !== ""),
        );

        if (rows.length === 0) {
          show({ type: "error", message: "Файл пуст" });
          return;
        }
        if (rows.length > MAX_ROWS) {
          show({ type: "error", message: `Максимум ${MAX_ROWS} строк` });
          return;
        }

        if (result.errors.length > 0) {
          // не блокируем, но предупреждаем о количестве «странных» строк
          const unique = new Set(
            result.errors.map((e) => e.row).filter((r) => r !== undefined),
          );
          show({
            type: "error",
            message: `CSV: ${unique.size} проблемных строк — проверьте импорт`,
          });
        }

        onParsed({
          fileName: file.name,
          headers,
          rows,
        });
      },
      error: () => {
        setLoading(false);
        show({ type: "error", message: "Не удалось прочитать файл" });
      },
    });
  };

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.dropzone} ${dragging ? styles.active : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) parseFile(file);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Icon name="file" size={32} className={styles.icon} />
        <span className={styles.hint}>
          Перетащите CSV или нажмите для выбора
        </span>
        <span className={styles.limit}>Максимум 10 МБ, до 5000 строк</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) parseFile(file);
          e.target.value = "";
        }}
      />

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Отмена
        </Button>
      </div>
    </div>
  );
}
