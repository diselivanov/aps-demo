import styles from "./index.module.css";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.logo}>aps-demo</span>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>Демо-версия приложения</footer>
    </div>
  );
}
