import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/user";
import Icon from "@/components/ui/Icon";
import UserMenu from "./UserMenu";
import styles from "./index.module.css";

export default async function Aside() {
  const user = await getCurrentUser();

  return (
    <aside className={styles.aside}>
      {user ? (
        <UserMenu user={user} />
      ) : (
        <Link href="/sign-in" className={styles.trigger} aria-label="Войти">
          <Icon name="user" />
        </Link>
      )}
    </aside>
  );
}
