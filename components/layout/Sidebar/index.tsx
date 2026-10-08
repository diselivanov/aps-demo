import { getCurrentUser } from "@/lib/auth/user";
import UserMenu from "./UserMenu";
import styles from "./index.module.css";

export default async function Sidebar() {
  const user = await getCurrentUser();

  return (
    <aside className={styles.sidebar}>
      <span className={styles.logo}>aps-demo</span>
      <nav className={styles.nav} />
      {user && (
        <div className={styles.footer}>
          <UserMenu user={user} />
        </div>
      )}
    </aside>
  );
}
