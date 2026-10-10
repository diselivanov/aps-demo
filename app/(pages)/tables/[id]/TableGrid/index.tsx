"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Select from "@/components/ui/Select";
import ContextMenu, { type ContextMenuItem } from "@/components/ui/ContextMenu";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import { useAlert } from "@/components/ui/Alert";
import RowPanel from "../RowPanel";
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
  rowId: number;
  fieldId: number;
  name: string;
  mime: string;
  size: number;
};

type Row = {
  id: number;
  createdAt: string;
  updatedAt: string;
  values: RowValue[];
  files: RowFile[];
};

type TableData = {
  id: number;
  name: string;
  folderId: number | null;
  fields: Field[];
  config: { columns: ColumnConfig[]; pageSize: number } | null;
};

type ColumnConfig = {
  fieldId: number;
  order: number;
  width: number;
};

const PAGE_SIZES = [10, 25, 50, 100];
const MIN_WIDTH = 80;
const MAX_WIDTH = 400;

export default function TableGrid({ tableId }: { tableId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { show } = useAlert();

  const [table, setTable] = useState<TableData | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
  }>({ open: false, x: 0, y: 0, items: [] });
  const [confirmRow, setConfirmRow] = useState<Row | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [widths, setWidths] = useState<Record<number, number>>({});
  const [resizing, setResizing] = useState<{
    fieldId: number | "id";
    startX: number;
    startWidth: number;
  } | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const sizeParam = searchParams.get("size");
  const sort = searchParams.get("sort");
  const dir = (searchParams.get("dir") as "asc" | "desc") ?? "desc";
  const rowParam = searchParams.get("row");
  const modeParam = searchParams.get("mode");
  const q = searchParams.get("q") ?? "";

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const loadTable = useCallback(async () => {
    const res = await fetch(`/api/tables/${tableId}`);
    if (!res.ok) {
      show({ type: "error", message: "Таблица не найдена" });
      return;
    }
    const json = await res.json();
    setTable(json.table);

    const cfg: ColumnConfig[] = json.table.config?.columns ?? [];
    const map: Record<number, number> = {};
    for (const c of cfg) map[c.fieldId] = c.width;
    setWidths(map);
  }, [tableId, show]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  const pageSize = sizeParam
    ? Number(sizeParam)
    : table?.config?.pageSize || 25;

  const loadRows = useCallback(async () => {
    if (!table) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(pageSize));
    if (sort) params.set("sort", sort);
    if (dir) params.set("dir", dir);
    if (q) params.set("q", q);

    const res = await fetch(`/api/tables/${tableId}/rows?${params}`);
    if (!res.ok) {
      show({ type: "error", message: "Не удалось загрузить записи" });
      setLoading(false);
      return;
    }
    const json = await res.json();
    setRows(json.rows);
    setTotal(json.total);
    setLoading(false);
  }, [table, tableId, page, pageSize, sort, dir, q, show]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - resizing.startX;
      const next = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, resizing.startWidth + delta),
      );
      setWidths((prev) => ({
        ...prev,
        [resizing.fieldId === "id" ? 0 : resizing.fieldId]: next,
      }));
    };
    const onUp = () => setResizing(null);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [resizing]);

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value.trim() || null });
    }, 300);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const toggleSelected = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggleSelectAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const r of rows) next.delete(r.id);
      } else {
        for (const r of rows) next.add(r.id);
      }
      return next;
    });
  };

  const bulkRemove = async () => {
    const ids = Array.from(selected);
    for (const id of ids) {
      const res = await fetch(`/api/tables/${tableId}/rows/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        show({ type: "error", message: json?.error ?? "Ошибка" });
        return;
      }
    }
    setConfirmBulk(false);
    exitSelectMode();
    loadRows();
    show({ type: "success", message: `Удалено: ${ids.length}` });
  };

  if (!table) {
    return <div className={styles.empty}></div>;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Field[] = (() => {
    const cfg = table.config?.columns ?? [];
    if (cfg.length === 0)
      return [...table.fields].sort((a, b) => a.order - b.order);
    const map = new Map(table.fields.map((f) => [f.id, f]));
    return cfg
      .sort((a, b) => a.order - b.order)
      .map((c) => map.get(c.fieldId))
      .filter((f): f is Field => Boolean(f));
  })();

  const getValue = (row: Row, field: Field) => {
    const vals = row.values.filter((v) => v.fieldId === field.id);
    if (vals.length === 0) return "";
    if (field.type === "MULTI_SELECT") {
      return vals
        .map((v) => v.valueString)
        .filter(Boolean)
        .join(", ");
    }
    const v = vals[0];
    if (field.type === "NUMBER") return v.valueNumber ?? "";
    if (field.type === "DATE") return v.valueDate ?? "";
    return v.valueString ?? "";
  };

  const highlight = (text: string, query: string) => {
    if (!query) return text;
    const lower = text.toLowerCase();
    const ql = query.toLowerCase();
    const parts: React.ReactNode[] = [];
    let i = 0;
    let key = 0;
    while (i < text.length) {
      const idx = lower.indexOf(ql, i);
      if (idx === -1) {
        parts.push(text.slice(i));
        break;
      }
      if (idx > i) parts.push(text.slice(i, idx));
      parts.push(
        <mark key={key++} className={styles.mark}>
          {text.slice(idx, idx + ql.length)}
        </mark>,
      );
      i = idx + ql.length;
    }
    return parts;
  };

  const renderValue = (row: Row, field: Field) => {
    if (field.type === "FILE") {
      const count =
        row.files?.filter((f) => f.fieldId === field.id).length ?? 0;
      if (count === 0) return "—";
      return (
        <span className={styles.fileCell}>
          <Icon name="file" size={14} />
          {count}
        </span>
      );
    }

    const raw = getValue(row, field);
    if (raw === "" || raw === null) return "—";
    if (field.type === "DATE") {
      return new Date(String(raw)).toLocaleDateString("ru-RU");
    }
    if (typeof raw !== "string") return String(raw);
    return q ? highlight(raw, q) : raw;
  };

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    if (key !== "page") params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const openRow = (id: number | "new", mode?: "edit") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("row", String(id));
    if (mode) params.set("mode", mode);
    else params.delete("mode");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const closeRow = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("row");
    params.delete("mode");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const removeRow = async (id: number) => {
    const res = await fetch(`/api/tables/${tableId}/rows/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      return;
    }
    setConfirmRow(null);
    if (rowParam === String(id)) closeRow();
    loadRows();
  };

  const openMenu = (e: React.MouseEvent, row: Row) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          id: "view",
          label: "Просмотр",
          icon: "eye",
          onClick: () => openRow(row.id),
        },
        {
          id: "edit",
          label: "Править",
          icon: "edit",
          onClick: () => openRow(row.id, "edit"),
        },
        {
          id: "delete",
          label: "Удалить",
          icon: "trash",
          onClick: () => setConfirmRow(row),
        },
      ],
    });
  };

  const closeMenu = () => setMenu((m) => ({ ...m, open: false }));

  const toggleSort = (field: Field) => {
    const key = String(field.id);
    if (sort !== key) {
      updateParams({ sort: key, dir: "asc" });
    } else if (dir === "asc") {
      updateParams({ sort: key, dir: "desc" });
    } else {
      updateParams({ sort: null, dir: null });
    }
  };

  const resetAll = () => {
    setSearchInput("");
    const params = new URLSearchParams();
    router.replace(`${pathname}?${params.toString()}`);
  };

  const toggleSortId = () => {
    if (sort !== "id") {
      updateParams({ sort: "id", dir: "asc" });
    } else if (dir === "asc") {
      updateParams({ sort: "id", dir: "desc" });
    } else {
      updateParams({ sort: null, dir: null });
    }
  };

  const renderPagination = () => {
    const pages: (number | "…")[] = [];
    const max = totalPages;

    if (max <= 7) {
      for (let i = 1; i <= max; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("…");
      const start = Math.max(2, page - 1);
      const end = Math.min(max - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < max - 2) pages.push("…");
      pages.push(max);
    }

    return (
      <div className={styles.pagination}>
        <button
          type="button"
          className={styles.pageBtn}
          disabled={page <= 1}
          onClick={() => setParam("page", String(page - 1))}
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className={styles.gap}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${p === page ? styles.pageActive : ""}`}
              onClick={() => setParam("page", String(p))}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={styles.pageBtn}
          disabled={page >= totalPages}
          onClick={() => setParam("page", String(page + 1))}
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    );
  };

  const rowId: number | "new" | null = rowParam
    ? rowParam === "new"
      ? "new"
      : Number(rowParam)
    : null;

  const initialMode: "view" | "edit" = modeParam === "edit" ? "edit" : "view";

  const visibleFields = (() => {
    const cfg = table.config?.columns ?? [];
    if (cfg.length === 0) return table.fields;
    const ids = new Set(cfg.map((c) => c.fieldId));
    return table.fields.filter((f) => ids.has(f.id));
  })();

  const totalCols = columns.length + (selectMode ? 2 : 1);

  return (
    <div className={styles.layout}>
      <motion.div
        className={styles.page}
        layout
        transition={{ duration: 0.15, ease: "linear" }}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {selectMode ? (
              <>
                <Button variant="secondary" onClick={exitSelectMode}>
                  Отмена
                </Button>
                <Button
                  variant="secondary"
                  disabled={selected.size === 0}
                  onClick={() => setConfirmBulk(true)}
                >
                  Удалить ({selected.size})
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setSelectMode(true)}>
                Выбрать
              </Button>
            )}
          </div>
          <div className={styles.headerActions}>
            <div className={styles.search}>
              <Icon name="search" size={16} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Поиск"
              />
            </div>
            <Button variant="secondary" onClick={resetAll}>
              Сброс
            </Button>
            <Button onClick={() => openRow("new")}>Добавить запись</Button>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <colgroup>
              {selectMode && <col style={{ width: 24 }} />}
              <col style={{ width: widths[0] ?? 80 }} />
              {columns.map((field) => (
                <col
                  key={field.id}
                  style={{ width: widths[field.id] ?? 160 }}
                />
              ))}
            </colgroup>
            <thead>
              <tr>
                {selectMode && (
                  <th className={styles.checkCell}>
                    <button
                      type="button"
                      className={styles.checkboxBtn}
                      onClick={toggleSelectAllOnPage}
                      aria-label="Выбрать все"
                    >
                      <span
                        className={`${styles.checkbox} ${
                          allOnPageSelected ? styles.checkboxChecked : ""
                        }`}
                      >
                        {allOnPageSelected && <Icon name="check" size={10} />}
                      </span>
                    </button>
                  </th>
                )}
                <th>
                  <div className={styles.thWrap}>
                    <button
                      type="button"
                      className={styles.th}
                      onClick={toggleSortId}
                    >
                      ID
                      {sort === "id" ? (
                        <Icon name="chevronUpDown" size={12} />
                      ) : (
                        <Icon
                          name="chevronUpDown"
                          size={12}
                          className={styles.thArrow}
                        />
                      )}
                    </button>
                    <span
                      className={styles.resizer}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setResizing({
                          fieldId: "id",
                          startX: e.clientX,
                          startWidth: widths[0] ?? 80,
                        });
                      }}
                    />
                  </div>
                </th>
                {columns.map((field) => (
                  <th key={field.id}>
                    <div className={styles.thWrap}>
                      <button
                        type="button"
                        className={styles.th}
                        onClick={() => toggleSort(field)}
                      >
                        {field.label}
                        {sort === String(field.id) ? (
                          <Icon name="chevronUpDown" size={12} />
                        ) : (
                          <Icon
                            name="chevronUpDown"
                            size={12}
                            className={styles.thArrow}
                          />
                        )}
                      </button>
                      <span
                        className={styles.resizer}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setResizing({
                            fieldId: field.id,
                            startX: e.clientX,
                            startWidth: widths[field.id] ?? 160,
                          });
                        }}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(totalCols, 1)}
                    className={styles.emptyCell}
                  >
                    Нет записей
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const checked = selected.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={`${styles.row} ${
                        rowId === row.id ? styles.rowActive : ""
                      }`}
                      onContextMenu={(e) => openMenu(e, row)}
                    >
                      {selectMode && (
                        <td className={styles.checkCell}>
                          <button
                            type="button"
                            className={styles.checkboxBtn}
                            onClick={() => toggleSelected(row.id)}
                            aria-label="Выбрать"
                          >
                            <span
                              className={`${styles.checkbox} ${
                                checked ? styles.checkboxChecked : ""
                              }`}
                            >
                              {checked && <Icon name="check" size={12} />}
                            </span>
                          </button>
                        </td>
                      )}
                      <td>
                        <span className={styles.cell}>{row.id}</span>
                      </td>
                      {columns.map((field) => (
                        <td key={field.id}>
                          <span className={styles.cell}>
                            {renderValue(row, field)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          {renderPagination()}
          <div className={styles.pageSizeWrap}>
            <Select
              value={String(pageSize)}
              options={PAGE_SIZES.map((s) => ({
                value: String(s),
                label: `${s} строк`,
              }))}
              onChange={(v) => setParam("size", v)}
            />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {rowId !== null && (
          <RowPanel
            tableId={tableId}
            rowId={rowId}
            fields={visibleFields}
            initialMode={initialMode}
            onClose={closeRow}
            onSaved={loadRows}
          />
        )}
      </AnimatePresence>

      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        items={menu.items}
        onClose={closeMenu}
      />

      <ConfirmActionModal
        open={confirmRow !== null}
        title="Удаление записи"
        description={
          confirmRow
            ? `Запись #${confirmRow.id} будет удалена без возможности восстановления.`
            : ""
        }
        keyword={confirmRow ? String(confirmRow.id) : ""}
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setConfirmRow(null)}
        onConfirm={() => confirmRow && removeRow(confirmRow.id)}
      />

      <ConfirmActionModal
        open={confirmBulk}
        title="Удаление записей"
        description={`Будет удалено ${selected.size} записей без возможности восстановления.`}
        keyword="Удалить"
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setConfirmBulk(false)}
        onConfirm={bulkRemove}
      />
    </div>
  );
}
