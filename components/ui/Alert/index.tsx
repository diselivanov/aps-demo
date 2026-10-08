"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./index.module.css";

type AlertType = "success" | "error";

type Alert = {
  id: number;
  type: AlertType;
  message: string;
};

type AlertContextValue = {
  show: (input: { type: AlertType; message: string }) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

const AUTO_CLOSE_MS = 5000;

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const remove = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const show = useCallback<AlertContextValue["show"]>(
    ({ type, message }) => {
      const id = Date.now() + Math.random();
      setAlerts((prev) => [{ id, type, message }, ...prev]);
      setTimeout(() => remove(id), AUTO_CLOSE_MS);
    },
    [remove],
  );

  return (
    <AlertContext.Provider value={{ show }}>
      {children}
      <div className={styles.stack}>
        <AnimatePresence initial={false} mode="popLayout">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, x: 120, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 120, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 650,
                damping: 26,
                mass: 0.5,
              }}
              className={`${styles.alert} ${styles[alert.type]}`}
            >
              {alert.message}
              <motion.span
                className={styles.progress}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: AUTO_CLOSE_MS / 1000, ease: "linear" }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
}
