"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
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

type Props = {
  tableId: number;
  headers: string[];
  onMapped: (mapping: Record<string, number>) => void;
  onBack: () => void;
};

const NONE = "__none__";

export default function Step2Mapping({
  tableId,
  headers,
  onMapped,
  onBack,
}: Props) {
  const { show } = useAlert();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/tables/${tableId}`);
      if (!res.ok) {
        show({ type: "error", message: "Таблица не найдена" });
        return;
      }
      const json = await res.json();
      const all: Field[] = json.table.fields;
      const target = all.filter((f) => f.type !== "FILE");
      setFields(target);

      const auto: Record<string, string> = {};
      for (const h of headers) {
        const match = target.find(
          (f) => f.label.trim().toLowerCase() === h.trim().toLowerCase(),
        );
        auto[h] = match ? String(match.id) : NONE;
      }
      setMapping(auto);
      setLoading(false);
    })();
  }, [tableId, headers, show]);

  const submit = () => {
    const result: Record<string, number> = {};
    const usedFieldIds = new Set<number>();

    for (const h of headers) {
      const v = mapping[h];
      if (!v || v === NONE) continue;
      const id = Number(v);
      if (usedFieldIds.has(id)) {
        const f = fields.find((x) => x.id === id);
        show({
          type: "error",
          message: `Поле «${f?.label}» уже сопоставлено`,
        });
        return;
      }
      usedFieldIds.add(id);
      result[h] = id;
    }

    const requiredMissing = fields.filter(
      (f) => f.required && !usedFieldIds.has(f.id),
    );
    if (requiredMissing.length > 0) {
      show({
        type: "error",
        message: `Обязательные поля не сопоставлены: ${requiredMissing
          .map((f) => f.label)
          .join(", ")}`,
      });
      return;
    }

    onMapped(result);
  };

  if (loading) {
    return <div className={styles.empty}></div>;
  }

  const options = [
    { value: NONE, label: "— Не импортировать —" },
    ...fields.map((f) => ({
      value: String(f.id),
      label: f.label + (f.required ? " *" : ""),
    })),
  ];

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>Сопоставьте колонки CSV с полями таблицы</p>

      <div className={styles.list}>
        {headers.map((h) => (
          <div key={h} className={styles.row}>
            <span className={styles.csvHeader}>{h}</span>
            <div className={styles.selectWrap}>
              <Select
                value={mapping[h] ?? NONE}
                options={options}
                onChange={(v) => setMapping((prev) => ({ ...prev, [h]: v }))}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onBack}>
          Назад
        </Button>
        <Button type="button" onClick={submit}>
          Импортировать
        </Button>
      </div>
    </div>
  );
}
