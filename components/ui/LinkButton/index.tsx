import Link from "next/link";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

type Variant = "primary" | "secondary" | "ghost";

type Props = ComponentProps<typeof Link> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export default function LinkButton({
  variant = "primary",
  fullWidth,
  className,
  ...props
}: Props) {
  return (
    <Link
      className={`${styles.btn} ${styles[variant]} ${
        fullWidth ? styles.fullWidth : ""
      } ${className ?? ""}`}
      {...props}
    />
  );
}
