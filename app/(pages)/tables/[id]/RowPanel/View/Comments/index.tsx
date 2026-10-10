"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import ContextMenu, { type ContextMenuItem } from "@/components/ui/ContextMenu";
import { useAlert } from "@/components/ui/Alert";
import styles from "./index.module.css";

type Comment = {
  id: number;
  text: string;
  authorId: string;
  author: { name: string };
  createdAt: string;
  updatedAt: string;
};

type Props = {
  tableId: number;
  rowId: number;
  onChanged: () => void;
};

const STORAGE_KEY = "comments-collapsed";

export default function Comments({ tableId, rowId, onChanged }: Props) {
  const { show } = useAlert();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const [menu, setMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
  }>({ open: false, x: 0, y: 0, items: [] });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      localStorage.setItem(STORAGE_KEY, String(!v));
      return !v;
    });
  };

  const load = useCallback(async () => {
    const res = await fetch(`/api/tables/${tableId}/rows/${rowId}`);
    if (!res.ok) return;
    const json = await res.json();
    setComments(json.row.comments ?? []);
    setLoading(false);
  }, [tableId, rowId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSubmitting(true);
    const res = await fetch(`/api/tables/${tableId}/rows/${rowId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      return;
    }

    setText("");
    load();
    onChanged();
  };

  const saveEdit = async (id: number) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;

    const res = await fetch(
      `/api/tables/${tableId}/rows/${rowId}/comments/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      return;
    }

    setEditingId(null);
    setEditingText("");
    load();
    onChanged();
  };

  const remove = async (id: number) => {
    const res = await fetch(
      `/api/tables/${tableId}/rows/${rowId}/comments/${id}`,
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

  const openMenu = (e: React.MouseEvent, comment: Comment) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          id: "edit",
          label: "Править",
          icon: "edit",
          onClick: () => {
            setEditingId(comment.id);
            setEditingText(comment.text);
          },
        },
        {
          id: "delete",
          label: "Удалить",
          icon: "trash",
          onClick: () => remove(comment.id),
        },
      ],
    });
  };

  const closeMenu = () => setMenu((m) => ({ ...m, open: false }));

  if (loading) return null;

  return (
    <div className={styles.block}>
      <button type="button" className={styles.blockHeader} onClick={toggle}>
        Комментарии
        {comments.length > 0 && ` (${comments.length})`}
      </button>

      {!collapsed && (
        <>
          {comments.length > 0 && (
            <div className={styles.list}>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={styles.comment}
                  onContextMenu={(e) => openMenu(e, comment)}
                >
                  <div className={styles.content}>
                    <div className={styles.head}>
                      <span className={styles.author}>
                        {comment.author.name}
                      </span>
                      <span className={styles.date}>
                        {new Date(comment.createdAt)
                          .toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                          .replace(" г.", "")}
                      </span>
                    </div>

                    {editingId === comment.id ? (
                      <div className={styles.editRow}>
                        <Input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(comment.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                        <Button onClick={() => saveEdit(comment.id)}>OK</Button>
                      </div>
                    ) : (
                      <p className={styles.text}>{comment.text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.form}>
            <input
              className={styles.input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") create();
              }}
              placeholder="Комментарий"
            />
            <button
              type="button"
              className={styles.send}
              onClick={create}
              disabled={submitting || !text.trim()}
              aria-label="Отправить"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </>
      )}

      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        items={menu.items}
        onClose={closeMenu}
      />
    </div>
  );
}
