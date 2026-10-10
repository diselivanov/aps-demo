"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import styles from "./index.module.css";

type Props = {
  open: boolean;
  title: string;
  description: string;
  keyword: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmActionModal({
  open,
  title,
  description,
  keyword,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const submit = () => {
    if (value !== keyword) {
      setError("Неверное значение");
      return;
    }
    onConfirm();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 1100,
              damping: 24,
              mass: 0.3,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.title}>{title}</h2>
            {description && <p className={styles.description}>{description}</p>}
            <Input
              placeholder={`Введите «${keyword}»`}
              value={value}
              error={error ?? undefined}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
            />
            <div className={styles.actions}>
              <Button variant="secondary" onClick={onCancel}>
                {cancelText}
              </Button>
              <Button onClick={submit}>{confirmText}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
