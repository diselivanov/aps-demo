"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import ContextMenu, { type ContextMenuItem } from "@/components/ui/ContextMenu";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import { useAlert } from "@/components/ui/Alert";
import styles from "./index.module.css";

type FolderNode = {
  id: number;
  name: string;
  parentId: number | null;
};

type TableNode = {
  id: number;
  name: string;
  folderId: number | null;
};

type MenuState = {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
};

type RenameState = {
  kind: "folder" | "table";
  id: number;
  value: string;
};

type ModalState =
  | { kind: "none" }
  | { kind: "delete-folder"; folder: FolderNode }
  | { kind: "delete-table"; table: TableNode };

export default function DocumentsTree() {
  const router = useRouter();
  const pathname = usePathname();
  const { show } = useAlert();

  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [tables, setTables] = useState<TableNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [rootOpen, setRootOpen] = useState(true);
  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());
  const [rename, setRename] = useState<RenameState | null>(null);
  const [menu, setMenu] = useState<MenuState>({
    open: false,
    x: 0,
    y: 0,
    items: [],
  });
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const load = useCallback(async () => {
    try {
      const [foldersRes, tablesRes] = await Promise.all([
        fetch("/api/folders"),
        fetch("/api/tables"),
      ]);
      const foldersJson = await foldersRes.json();
      const tablesJson = await tablesRes.json();
      setFolders(foldersJson.folders ?? []);
      setTables(tablesJson.tables ?? []);
    } catch {
      show({ type: "error", message: "Не удалось загрузить дерево" });
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-root-open");
    if (stored === "false") setRootOpen(false);

    const storedFolders = localStorage.getItem("sidebar-open-folders");
    if (storedFolders) {
      try {
        setOpenFolders(new Set(JSON.parse(storedFolders)));
      } catch {}
    }
  }, []);

  const persistFolders = useCallback((next: Set<number>) => {
    localStorage.setItem("sidebar-open-folders", JSON.stringify([...next]));
  }, []);

  const toggleRoot = () => {
    setRootOpen((v) => {
      localStorage.setItem("sidebar-root-open", String(!v));
      return !v;
    });
  };

  const toggleFolder = (id: number) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistFolders(next);
      return next;
    });
  };

  const closeMenu = () => setMenu((m) => ({ ...m, open: false }));

  const openMenu = (e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ open: true, x: e.clientX, y: e.clientY, items });
  };

  const submitRename = async () => {
    if (!rename) return;
    const trimmed = rename.value.trim();
    if (!trimmed) {
      setRename(null);
      return;
    }

    const url =
      rename.kind === "folder"
        ? `/api/folders/${rename.id}`
        : `/api/tables/${rename.id}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      return;
    }

    setRename(null);
    await load();
  };

  const buildRootMenu = (): ContextMenuItem[] => [
    {
      id: "create-folder",
      label: "Создать папку",
      icon: "folderPlus",
      onClick: () => router.push("/folders/new"),
    },
    {
      id: "create-table",
      label: "Создать таблицу",
      icon: "tablePlus",
      onClick: () => router.push("/tables/new"),
    },
  ];

  const buildFolderMenu = (folder: FolderNode): ContextMenuItem[] => {
    const hasChildren =
      folders.some((f) => f.parentId === folder.id) ||
      tables.some((t) => t.folderId === folder.id);

    return [
      {
        id: "create-folder",
        label: "Создать папку",
        icon: "folderPlus",
        onClick: () => router.push(`/folders/new?parentId=${folder.id}`),
      },
      {
        id: "create-table",
        label: "Создать таблицу",
        icon: "tablePlus",
        onClick: () => router.push(`/tables/new?folderId=${folder.id}`),
      },
      {
        id: "rename",
        label: "Переименовать",
        icon: "edit",
        onClick: () =>
          setRename({ kind: "folder", id: folder.id, value: folder.name }),
      },
      {
        id: "delete",
        label: "Удалить",
        icon: "trash",
        onClick: () => setModal({ kind: "delete-folder", folder }),
        disabled: hasChildren,
      },
    ];
  };

  const buildTableMenu = (table: TableNode): ContextMenuItem[] => [
    {
      id: "rename",
      label: "Переименовать",
      icon: "edit",
      onClick: () =>
        setRename({ kind: "table", id: table.id, value: table.name }),
    },
    {
      id: "config",
      label: "Настройки ",
      icon: "settings",
      onClick: () => router.push(`/tables/${table.id}/settings`),
    },
    {
      id: "delete",
      label: "Удалить ",
      icon: "trash",
      onClick: () => setModal({ kind: "delete-table", table }),
    },
  ];

  const sortByName = <T extends { name: string }>(list: T[]) =>
    [...list].sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const renderRenameInput = () => (
    <input
      className={styles.renameInput}
      value={rename?.value ?? ""}
      autoFocus
      onChange={(e) =>
        setRename((r) => (r ? { ...r, value: e.target.value } : r))
      }
      onKeyDown={(e) => {
        if (e.key === "Enter") submitRename();
        if (e.key === "Escape") setRename(null);
      }}
      onBlur={submitRename}
      onClick={(e) => e.stopPropagation()}
    />
  );

  const renderTable = (table: TableNode, depth: number) => {
    const active = pathname === `/tables/${table.id}`;
    const editing = rename?.kind === "table" && rename.id === table.id;

    return (
      <button
        key={`table-${table.id}`}
        type="button"
        className={`${styles.item} ${active ? styles.active : ""}`}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={() => {
          if (editing) return;
          router.push(`/tables/${table.id}`);
        }}
        onContextMenu={(e) => openMenu(e, buildTableMenu(table))}
      >
        <Icon name="table" size={16} />
        {editing ? (
          renderRenameInput()
        ) : (
          <span className={styles.label}>{table.name}</span>
        )}
      </button>
    );
  };

  const renderFolder = (folder: FolderNode, depth: number) => {
    const children = sortByName(
      folders.filter((f) => f.parentId === folder.id),
    );
    const folderTables = sortByName(
      tables.filter((t) => t.folderId === folder.id),
    );
    const open = openFolders.has(folder.id);
    const editing = rename?.kind === "folder" && rename.id === folder.id;

    return (
      <div key={`folder-${folder.id}`}>
        <button
          type="button"
          className={styles.item}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => {
            if (editing) return;
            toggleFolder(folder.id);
          }}
          onContextMenu={(e) => openMenu(e, buildFolderMenu(folder))}
        >
          <Icon name={open ? "folderOpen" : "folder"} size={16} />
          {editing ? (
            renderRenameInput()
          ) : (
            <span className={styles.label}>{folder.name}</span>
          )}
          <Icon name="chevronUpDown" size={12} className={styles.arrow} />
        </button>
        {open && (
          <>
            {children.map((child) => renderFolder(child, depth + 1))}
            {folderTables.map((table) => renderTable(table, depth + 1))}
          </>
        )}
      </div>
    );
  };

  const rootFolders = sortByName(folders.filter((f) => f.parentId === null));
  const rootTables = sortByName(tables.filter((t) => t.folderId === null));

  if (loading) {
    return <div className={styles.empty}></div>;
  }

  return (
    <>
      <button
        type="button"
        className={styles.item}
        style={{ paddingLeft: "12px" }}
        onClick={toggleRoot}
        onContextMenu={(e) => openMenu(e, buildRootMenu())}
      >
        <Icon name={rootOpen ? "folderOpen" : "folder"} size={16} />
        <span className={styles.label}>Документы</span>
        <Icon name="chevronUpDown" size={12} className={styles.arrow} />
      </button>

      {rootOpen && (
        <>
          {rootFolders.map((folder) => renderFolder(folder, 1))}
          {rootTables.map((table) => renderTable(table, 1))}
        </>
      )}

      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        items={menu.items}
        onClose={closeMenu}
      />

      {modal.kind === "delete-folder" && (
        <ConfirmActionModal
          open
          title="Удаление папки"
          description={`Вы уверены, что хотите удалить папку «${modal.folder.name}» ?`}
          keyword={modal.folder.name}
          confirmText="Удалить"
          cancelText="Отмена"
          onCancel={() => setModal({ kind: "none" })}
          onConfirm={async () => {
            const res = await fetch(`/api/folders/${modal.folder.id}`, {
              method: "DELETE",
            });
            if (!res.ok) {
              const json = await res.json().catch(() => null);
              show({ type: "error", message: json?.error ?? "Ошибка" });
              return;
            }
            setModal({ kind: "none" });
            await load();
          }}
        />
      )}

      {modal.kind === "delete-table" && (
        <ConfirmActionModal
          open
          title="Удаление таблицы"
          description={`Таблица «${modal.table.name}» и все её записи будут удалены.`}
          keyword={modal.table.name}
          confirmText="Удалить"
          cancelText="Отмена"
          onCancel={() => setModal({ kind: "none" })}
          onConfirm={async () => {
            const res = await fetch(`/api/tables/${modal.table.id}`, {
              method: "DELETE",
            });
            if (!res.ok) {
              const json = await res.json().catch(() => null);
              show({ type: "error", message: json?.error ?? "Ошибка" });
              return;
            }
            setModal({ kind: "none" });
            await load();
            if (pathname === `/tables/${modal.table.id}`) router.push("/");
          }}
        />
      )}
    </>
  );
}
