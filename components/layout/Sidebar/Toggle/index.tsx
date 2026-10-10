"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import styles from "./index.module.css";

const STORAGE_KEY = "sidebar-collapsed";

export default function Toggle() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setCollapsed(true);
      document.documentElement.dataset.sidebar = "collapsed";
    }
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(STORAGE_KEY, String(next));
      if (next) document.documentElement.dataset.sidebar = "collapsed";
      else delete document.documentElement.dataset.sidebar;
      return next;
    });
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      className={`${styles.btn} ${collapsed ? styles.floating : ""}`}
      onClick={toggle}
      aria-label={collapsed ? "Развернуть" : "Свернуть"}
    >
      <Icon name={"panelLeft"} size={16} />
    </button>
  );
}
