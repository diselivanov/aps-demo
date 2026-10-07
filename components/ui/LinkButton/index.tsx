"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

type Variant = "primary" | "secondary" | "ghost";

type Props = ComponentProps<typeof Link> & {
  variant?: Variant;
};

export default function LinkButton({
  variant = "primary",
  className,
  ...props
}: Props) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 900, damping: 22, mass: 0.3 }}
      style={{ display: "inline-flex" }}
    >
      <Link
        className={`${styles.btn} ${styles[variant]} ${className ?? ""}`}
        {...props}
      />
    </motion.div>
  );
}
