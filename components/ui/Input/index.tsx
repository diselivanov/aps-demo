import styles from "./index.module.css";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, ...props }: Props) {
  return <input className={`${styles.input} ${className ?? ""}`} {...props} />;
}
