import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import ContextMenuBlocker from "@/components/layout/ContextMenuBlocker";
import styles from "./index.module.css";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <ContextMenuBlocker />
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
