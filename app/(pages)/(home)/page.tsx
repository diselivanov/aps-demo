"use client";

import Button from "@/components/ui/Button";
import { useAlert } from "@/components/ui/Alert";
import styles from "./page.module.css";

export default function Home() {
  const { show } = useAlert();

  return (
    <div className={styles.page}>
      <Button onClick={() => show({ type: "success", message: "Успех" })}>
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() => show({ type: "error", message: "Ошибка" })}
      >
        Error
      </Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  );
}
