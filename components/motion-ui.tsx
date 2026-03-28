"use client";

import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";

// ==========================================
// 1. HOVER.DEV INSPIRED: 3D Tilt Card
// Perfect for your Dashboard Stats and Alert Cards
// ==========================================
export function TiltCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Springs make the tilt feel heavy and premium, not jerky
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useMotionTemplate`calc(${mouseYSpring} * -10deg)`;
  const rotateY = useMotionTemplate`calc(${mouseXSpring} * 10deg)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative rounded-3xl border border-white/60 bg-white/50 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-xl ${className}`}
    >
      <div
        style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}
        className="h-full w-full"
      >
        {children}
      </div>
    </motion.div>
  );
}

// ==========================================
// 2. SNIPZY INSPIRED: Liquid Glass Button
// Use this for your "Start Scan" or "Generate Report" buttons
// ==========================================
export function LiquidGlassButton({
  children,
  className = "",
  type = "button",
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`relative group overflow-hidden rounded-full bg-teal-800/80 px-8 py-3 font-semibold text-white shadow-[0_0_40px_-10px_rgba(15,118,110,0.5)] backdrop-blur-md border border-teal-500/30 transition-all hover:bg-teal-700/90 hover:shadow-[0_0_60px_-15px_rgba(15,118,110,0.7)] ${className}`}
    >
      {/* Liquid Glare Effect */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></span>
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}

// ==========================================
// 3. FRAMER MOTION: Fluid Staggered Feed
// Wrap your Alerts List or Dashboard sections in this!
// ==========================================
export function StaggeredFeed({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Delays each child by 0.1s so they waterfall in
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {React.Children.map(children, (child) => (
         <motion.div variants={item}>{child}</motion.div>
      ))}
    </motion.div>
  );
}
