"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import View from "./View";
import Edit from "./Edit";
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

type Props = {
  tableId: number;
  rowId: number | "new";
  fields: Field[];
  initialMode?: "view" | "edit";
  onClose: () => void;
  onSaved: () => void;
};

const MIN_WIDTH = 300;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 400;
const STORAGE_KEY = "row-panel-width";

export default function RowPanel({
  tableId,
  rowId,
  fields,
  initialMode = "view",
  onClose,
  onSaved,
}: Props) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const n = Number(stored);
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) setWidth(n);
    }
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const next = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, window.innerWidth - e.clientX),
      );
      setWidth(next);
    };
    const onUp = () => {
      if (dragging) {
        setDragging(false);
        localStorage.setItem(STORAGE_KEY, String(width));
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [dragging, width]);

  return (
    <motion.aside
      className={styles.panel}
      initial={{ width: 0 }}
      animate={{ width }}
      exit={{ width: 0 }}
      transition={
        dragging ? { duration: 0 } : { duration: 0.2, ease: "linear" }
      }
    >
      <div
        className={styles.resizer}
        onMouseDown={() => setDragging(true)}
        onDoubleClick={() => {
          setWidth(DEFAULT_WIDTH);
          localStorage.setItem(STORAGE_KEY, String(DEFAULT_WIDTH));
        }}
      />

      <header className={styles.header}>
        <span className={styles.title}>
          {rowId === "new" ? "Новая запись" : `Запись #${rowId}`}
        </span>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <Icon name="cross" size={16} />
        </button>
      </header>

      <div className={styles.body}>
        {rowId === "new" ? (
          <Edit
            key="new"
            mode="create"
            tableId={tableId}
            fields={fields}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : (
          <PanelContent
            key={`${rowId}-${initialMode}`}
            tableId={tableId}
            rowId={rowId}
            fields={fields}
            initialMode={initialMode}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </div>
    </motion.aside>
  );
}

function PanelContent({
  tableId,
  rowId,
  fields,
  initialMode,
  onClose,
  onSaved,
}: {
  tableId: number;
  rowId: number;
  fields: Field[];
  initialMode: "view" | "edit";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [initial, setInitial] = useState<RowValue[] | null>(null);

  useEffect(() => {
    if (mode !== "edit" || initial) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/tables/${tableId}/rows/${rowId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (!cancelled) setInitial(json.row.values);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, initial, tableId, rowId]);

  if (mode === "edit") {
    if (!initial) {
      return <div className={styles.loading}></div>;
    }
    return (
      <Edit
        mode="edit"
        tableId={tableId}
        rowId={rowId}
        fields={fields}
        initial={initial}
        onClose={onClose}
        onSaved={onSaved}
        onCancel={() => {
          setInitial(null);
          setMode("view");
        }}
      />
    );
  }

  return (
    <View
      tableId={tableId}
      rowId={rowId}
      fields={fields}
      onEdit={() => setMode("edit")}
      onSaved={onSaved}
    />
  );
}
