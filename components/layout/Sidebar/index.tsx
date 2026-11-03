import { getCurrentUser } from "@/lib/auth/user";
import UserMenu from "./UserMenu";
import DocumentsTree from "./DocumentsTree";
import Toggle from "./Toggle";
import LinkButton from "@/components/ui/LinkButton";
import styles from "./index.module.css";

export default async function Sidebar() {
  const user = await getCurrentUser();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarInner}>
        <div className={styles.logo}>
          <span className={styles.logoText}>aps-demo</span>
          <Toggle />
        </div>
        <nav className={styles.nav}>
          <DocumentsTree />
        </nav>
        <div className={styles.footer}>
          {user ? (
            <UserMenu user={user} />
          ) : (
            <LinkButton fullWidth href="/sign-in">
              Войти
            </LinkButton>
          )}
        </div>
      </div>
    </aside>
  );
}
