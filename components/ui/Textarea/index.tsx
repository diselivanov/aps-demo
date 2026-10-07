import styles from "./index.module.css";
import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({ className, ...props }: Props) {
  return (
    <textarea className={`${styles.textarea} ${className ?? ""}`} {...props} />
  );
}
