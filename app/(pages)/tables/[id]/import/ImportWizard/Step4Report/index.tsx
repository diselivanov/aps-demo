"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import styles from "./index.module.css";

type ReportItem = {
  rowNumber: number;
  message: string;
};

type Props = {
  tableId: number;
  created: number;
  skipped: number;
  errors: ReportItem[];
};

export default function Step4Report({
  tableId,
  created,
  skipped,
  errors,
}: Props) {
  const router = useRouter();

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{created}</span>
          <span className={styles.statLabel}>импортировано</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{skipped}</span>
          <span className={styles.statLabel}>пропущено</span>
        </div>
      </div>

      {errors.length > 0 && (
        <div className={styles.errors}>
          <h2 className={styles.errorsTitle}>Ошибки</h2>
          <div className={styles.errorList}>
            {errors.map((e, i) => (
              <div key={i} className={styles.errorRow}>
                <span className={styles.errorNum}>
                  {e.rowNumber > 0 ? `Строка ${e.rowNumber}` : "—"}
                </span>
                <span className={styles.errorMsg}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <Button onClick={() => router.push(`/tables/${tableId}`)}>
          К таблице
        </Button>
      </div>
    </div>
  );
}
