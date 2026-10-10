"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import styles from "./index.module.css";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  options: SelectOption[];
  label?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function Select({
  value,
  options,
  label,
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setPlacement(
      spaceBelow < 240 && spaceAbove > spaceBelow ? "top" : "bottom",
    );
  }, [open]);

  const current = options.find((o) => o.value === value);
  const lifted = open || Boolean(current);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ""}`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.value}>{current?.label ?? ""}</span>
        <Icon name="chevronUpDown" size={12} className={styles.arrow} />
      </button>

      {label && (
        <span className={`${styles.label} ${lifted ? styles.lifted : ""}`}>
          {label}
        </span>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropdownRef}
            className={`${styles.dropdown} ${
              placement === "top" ? styles.dropdownTop : ""
            }`}
            initial={{
              opacity: 0,
              y: placement === "top" ? 4 : -4,
              scale: 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "top" ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.1 }}
          >
            {options.map((option, index) => (
              <button
                key={`${option.value}-${index}`}
                type="button"
                className={styles.option}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                {option.value === value && (
                  <Icon name="check" size={14} className={styles.check} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
