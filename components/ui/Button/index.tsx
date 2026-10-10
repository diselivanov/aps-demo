import styles from "./index.module.css";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
