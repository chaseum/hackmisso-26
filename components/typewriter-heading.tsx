"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function TypewriterHeading({
  text,
  className,
  speed = 32,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    setVisibleText("");
    let index = 0;

    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [speed, text]);

  return (
    <motion.h1
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={className}
    >
      {visibleText}
      <span className="ml-1 inline-block h-[0.95em] w-[0.08em] animate-pulse rounded-full bg-cyan-300 align-[-0.1em]" />
    </motion.h1>
  );
}
