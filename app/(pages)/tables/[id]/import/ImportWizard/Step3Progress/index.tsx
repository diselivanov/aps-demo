"use client";

import { useEffect, useRef, useState } from "react";
import { useAlert } from "@/components/ui/Alert";
import styles from "./index.module.css";

type Field = {
  id: number;
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
};

type RowValuePayload = {
  fieldId: number;
  valueString?: string;
  valueNumber?: number;
  valueDate?: string;
  order: number;
};

type ReportItem = {
  rowNumber: number;
  message: string;
};

type Props = {
  tableId: number;
  headers: string[];
  rows: Record<string, string>[];
  mapping: Record<string, number>;
  onDone: (report: {
    created: number;
    skipped: number;
    errors: ReportItem[];
  }) => void;
};

const CHUNK = 10;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = Date.parse(trimmed);
  if (!Number.isNaN(iso)) return new Date(iso).toISOString();

  const m = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

export default function Step3Progress({
  tableId,
  headers,
  rows,
  mapping,
  onDone,
}: Props) {
  const { show } = useAlert();
  const [fields, setFields] = useState<Field[]>([]);
  const [processed, setProcessed] = useState(0);
  const [created, setCreated] = useState(0);
  const [errors, setErrors] = useState<ReportItem[]>([]);
  const [running, setRunning] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/tables/${tableId}`);
      if (!res.ok) {
        show({ type: "error", message: "Таблица не найдена" });
        return;
      }
      const json = await res.json();
      setFields(json.table.fields);
    })();
  }, [tableId, show]);

  useEffect(() => {
    if (fields.length === 0 || started.current) return;
    started.current = true;
    run();
  }, [fields]);

  const run = async () => {
    setRunning(true);
    const fieldMap = new Map(fields.map((f) => [f.id, f]));
    const total = rows.length;

    let createdCount = 0;
    const allErrors: ReportItem[] = [];

    await delay(800);

    for (let offset = 0; offset < total; offset += CHUNK) {
      const slice = rows.slice(offset, offset + CHUNK);
      const payload: { values: RowValuePayload[] }[] = [];
      const payloadRowNumbers: number[] = [];

      for (let i = 0; i < slice.length; i++) {
        const row = slice[i];
        const rowNumber = offset + i + 2;

        const values: RowValuePayload[] = [];
        let rowError: string | null = null;

        for (const header of headers) {
          const fieldId = mapping[header];
          if (!fieldId) continue;
          const field = fieldMap.get(fieldId);
          if (!field) continue;

          const raw = (row[header] ?? "").trim();

          if (field.type === "STRING" || field.type === "TEXT") {
            if (raw) values.push({ fieldId, valueString: raw, order: 0 });
          } else if (field.type === "NUMBER") {
            if (raw) {
              const n = Number(raw.replace(",", "."));
              if (Number.isNaN(n)) {
                rowError = `Поле «${field.label}»: не число («${raw}»)`;
                break;
              }
              values.push({ fieldId, valueNumber: n, order: 0 });
            }
          } else if (field.type === "DATE") {
            if (raw) {
              const iso = parseDate(raw);
              if (!iso) {
                rowError = `Поле «${field.label}»: некорректная дата («${raw}»)`;
                break;
              }
              values.push({ fieldId, valueDate: iso, order: 0 });
            }
          } else if (field.type === "SELECT") {
            if (raw) {
              const opts = field.options ?? [];
              if (!opts.includes(raw)) {
                rowError = `Поле «${field.label}»: значение «${raw}» отсутствует в списке`;
                break;
              }
              values.push({ fieldId, valueString: raw, order: 0 });
            }
          } else if (field.type === "MULTI_SELECT") {
            if (raw) {
              const opts = field.options ?? [];
              const parts = raw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const invalid = parts.find((p) => !opts.includes(p));
              if (invalid) {
                rowError = `Поле «${field.label}»: значение «${invalid}» отсутствует в списке`;
                break;
              }
              parts.forEach((p, idx) =>
                values.push({ fieldId, valueString: p, order: idx }),
              );
            }
          }
        }

        if (rowError) {
          allErrors.push({ rowNumber, message: rowError });
          continue;
        }

        const requiredMissing = fields.find(
          (f) =>
            f.required &&
            f.type !== "FILE" &&
            !values.some((v) => v.fieldId === f.id),
        );
        if (requiredMissing) {
          allErrors.push({
            rowNumber,
            message: `Поле «${requiredMissing.label}» обязательно`,
          });
          continue;
        }

        payload.push({ values });
        payloadRowNumbers.push(rowNumber);
      }

      if (payload.length > 0) {
        const res = await fetch(`/api/tables/${tableId}/rows/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: payload }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          allErrors.push({
            rowNumber: 0,
            message: json?.error ?? "Ошибка сервера",
          });
        } else {
          const json = await res.json();
          createdCount += json.created;
          for (const e of json.errors as { index: number; message: string }[]) {
            allErrors.push({
              rowNumber: payloadRowNumbers[e.index] ?? 0,
              message: e.message,
            });
          }
        }
      }

      await delay(220);

      setProcessed(Math.min(offset + CHUNK, total));
      setCreated(createdCount);
      setErrors([...allErrors]);
    }

    await delay(800);
    setRunning(false);
    onDone({
      created: createdCount,
      skipped: total - createdCount,
      errors: allErrors,
    });
  };

  const total = rows.length;
  const percent = total === 0 ? 0 : Math.round((processed / total) * 100);

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        Импортировано {processed} из {total}
      </p>

      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>

      <div className={styles.status}>
        {running ? "Импортируем…" : "Готово"} · {percent}%
      </div>
    </div>
  );
}
