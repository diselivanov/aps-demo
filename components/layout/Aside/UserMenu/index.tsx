"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
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
        aria-label="Профиль"
      >
        <Icon name="user" size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={styles.dropdown}
          >
            <div className={styles.user}>
              <div className={styles.avatar}>
                <Icon name="user" size={26} />
              </div>
              <span className={styles.name}>{user.name}</span>
            </div>

            <div className={styles.actions}>
              <Link
                href="/settings"
                className={styles.item}
                onClick={() => setOpen(false)}
              >
                <Icon name="settings" size={18} />
                Настройки
              </Link>

              <button type="button" className={styles.item} onClick={logout}>
                <Icon name="logout" size={18} />
                Выйти
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
