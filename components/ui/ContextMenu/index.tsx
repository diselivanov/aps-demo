"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import styles from "./index.module.css";

export type ContextMenuItem = {
  id: string;
  label: string;
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
};

type Props = {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export default function ContextMenu({ open, x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    const onContextMenu = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", onScroll, true);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          className={styles.menu}
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12 }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.item}
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                onClose();
              }}
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
