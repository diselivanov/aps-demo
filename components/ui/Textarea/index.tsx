"use client";

import { useId, useState } from "react";
import styles from "./index.module.css";
import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
};

export default function Textarea({
  error,
  className,
  placeholder,
  onFocus,
  onBlur,
  onChange,
  defaultValue,
  value,
  ...props
}: Props) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [inner, setInner] = useState(String(defaultValue ?? ""));
  const controlled = value !== undefined;
  const current = controlled ? String(value) : inner;
  const lifted = focused || current.length > 0;

  return (
    <div className={styles.field}>
      <div className={styles.control}>
        <textarea
          id={id}
          className={`${styles.textarea} ${error ? styles.invalid : ""} ${
            className ?? ""
          }`}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onChange={(e) => {
            if (!controlled) setInner(e.target.value);
            onChange?.(e);
          }}
          placeholder=" "
          {...props}
        />
        {placeholder && (
          <label
            htmlFor={id}
            className={`${styles.label} ${lifted ? styles.lifted : ""}`}
          >
            {placeholder}
          </label>
        )}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
