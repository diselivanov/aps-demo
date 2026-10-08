"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useAlert } from "@/components/ui/Alert";
import styles from "./index.module.css";

type Props = {
  user: {
    name: string;
    email: string;
  };
};

export default function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { show } = useAlert();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const logout = async () => {
    setConfirm(false);
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (!res.ok) {
      show({ type: "error", message: "Не удалось выйти" });
      return;
    }
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label="Меню пользователя"
      >
        <span className={styles.avatar}>
          <Icon name="user" size={16} />
        </span>
        <span className={styles.name}>{user.name}</span>
        <Icon name="more" size={14} className={styles.more} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={styles.dropdown}
          >
            <Link
              href="/settings"
              className={styles.item}
              onClick={() => setOpen(false)}
            >
              <Icon name="settings" size={16} />
              Настройки
            </Link>

            <button
              type="button"
              className={styles.item}
              onClick={() => {
                setOpen(false);
                setConfirm(true);
              }}
            >
              <Icon name="logout" size={16} />
              Выйти
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirm}
        title="Выход из аккаунта"
        description="Вы уверены, что хотите выйти из аккаунта?"
        confirmText="Выйти"
        cancelText="Отмена"
        onConfirm={logout}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
