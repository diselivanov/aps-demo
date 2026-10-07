import styles from "./index.module.css";
import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Aside from "@/components/layout/Aside";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
      <Aside />
    </div>
  );
}
