"use client";

import { motion } from "framer-motion";

export function SuccessCheckmark({ size = 64 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-primary"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d="M20 33 L28 41 L44 25"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.4, ease: "easeOut" }}
      />
    </motion.svg>
  );
}
