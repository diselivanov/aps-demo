import styles from "./index.module.css";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <span className={styles.logo}>aps-demo</span>
      <nav className={styles.nav} />
    </aside>
  );
}
