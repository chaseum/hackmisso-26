"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type SecurityMetric = {
  label: string;
  value: string;
  detail: string;
  valueClassName?: string;
};

function getScoreBarClass(scorePercent: number) {
  if (scorePercent <= 20) {
    return "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.55)]";
  }

  if (scorePercent <= 40) {
    return "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]";
  }

  return "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.5)]";
}

export function DashboardSecurityData({
  metrics,
  scorePercent,
}: {
  metrics: SecurityMetric[];
  scorePercent: number;
}) {
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const activeMetric = metrics[activeMetricIndex];

  return (
    <section className="card-glass fade-up h-full space-y-6 rounded-[2.5rem] p-8" style={{ animationDelay: "0.2s" }}>
      <h2 className="border-b border-white/5 pb-4 text-base font-bold uppercase tracking-widest text-white [font-family:var(--font-mono)]">
        Vulnerabilities
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <motion.button
            key={metric.label}
            type="button"
            layout
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveMetricIndex(index)}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              activeMetricIndex === index
                ? "border-cyan-500/30 bg-cyan-500/10"
                : "border-white/5 bg-white/[0.02] hover:border-cyan-500/20"
            }`}
          >
            <p className="text-[11px] uppercase tracking-wider text-slate-400">{metric.label}</p>
            <p
              className={`mt-2 font-bold text-white [font-family:var(--font-display)] ${
                metric.valueClassName ?? "text-4xl"
              }`}
            >
              {metric.value}
            </p>
          </motion.button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMetric.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="p-5"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">{activeMetric.label}</p>
            <p className="mt-3 text-base leading-7 text-slate-200">{activeMetric.detail}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pt-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className={`h-full ${getScoreBarClass(scorePercent)}`}
            initial={{ width: 0 }}
            animate={{ width: `${scorePercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </section>
  );
}
