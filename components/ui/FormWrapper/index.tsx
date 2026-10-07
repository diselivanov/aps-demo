import styles from "./index.module.css";
import type { FormEventHandler, ReactNode } from "react";

type Props = {
  title: string;
  width?: "sm" | "md";
  onSubmit?: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
};

export default function FormWrapper({
  title,
  width = "sm",
  onSubmit,
  children,
}: Props) {
  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} ${styles[width]}`}>
        <h1 className={styles.title}>{title}</h1>
        <form className={styles.form} onSubmit={onSubmit}>
          {children}
        </form>
      </div>
    </div>
  );
}
