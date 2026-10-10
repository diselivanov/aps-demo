"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import styles from "./index.module.css";

type Props = {
  label: string;
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
};

export default function MultiSelect({
  label,
  value,
  options,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const rootRef = useRef<HTMLDivElement>(null);

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

  const toggle = (option: string) => {
    if (value.includes(option)) onChange(value.filter((v) => v !== option));
    else onChange([...value, option]);
  };

  const lifted = open || value.length > 0;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <div className={styles.badges}>
          {value.map((v, i) => (
            <span key={`${v}-${i}`} className={styles.badge}>
              {v}
            </span>
          ))}
        </div>
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
            {options.map((option, index) => {
              const checked = value.includes(option);
              return (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  className={styles.option}
                  onClick={() => toggle(option)}
                >
                  <span
                    className={`${styles.checkbox} ${
                      checked ? styles.checkboxChecked : ""
                    }`}
                  >
                    {checked && <Icon name="check" size={12} />}
                  </span>
                  <span className={styles.optionLabel}>{option}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
