"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import styles from "./index.module.css";

type Variant = "primary" | "secondary" | "ghost";

type Props = HTMLMotionProps<"button"> & {
  variant?: Variant;
};

export default function Button({
  variant = "primary",
  className,
  ...props
}: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 900, damping: 22, mass: 0.3 }}
      className={`${styles.btn} ${styles[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
