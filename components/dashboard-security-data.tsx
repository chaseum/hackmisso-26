"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type SecurityMetric = {
  label: string;
  value: string;
  detail: string;
  valueClassName?: string;
};

function getMetricVisual(label: string) {
  if (label === "High Priority Alerts") {
    return {
      anchor: "!",
      eyebrow: "Urgent",
      tileClassName: "border-rose-500/20 bg-[linear-gradient(145deg,rgba(251,113,133,0.14),rgba(13,17,23,0.96))]",
      anchorClassName: "bg-rose-500/12 text-rose-300",
    };
  }

  if (label === "Total Gaps") {
    return {
      anchor: "D",
      eyebrow: "Coverage",
      tileClassName: "border-amber-400/20 bg-[linear-gradient(145deg,rgba(251,191,36,0.12),rgba(13,17,23,0.96))]",
      anchorClassName: "bg-amber-400/12 text-amber-200",
    };
  }

  if (label === "Controls Passing") {
    return {
      anchor: "A",
      eyebrow: "Controls",
      tileClassName: "border-cyan-400/20 bg-[linear-gradient(145deg,rgba(34,211,238,0.12),rgba(13,17,23,0.96))]",
      anchorClassName: "bg-cyan-400/12 text-cyan-200",
    };
  }

  return {
    anchor: "24",
    eyebrow: "Snapshot",
    tileClassName: "border-white/10 bg-[linear-gradient(145deg,rgba(148,163,184,0.1),rgba(13,17,23,0.96))]",
    anchorClassName: "bg-white/8 text-slate-100",
  };
}

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
          (() => {
            const visual = getMetricVisual(metric.label);

            return (
              <motion.button
                key={metric.label}
                type="button"
                layout
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMetricIndex(index)}
                className={`min-h-40 rounded-[1.75rem] border p-4 text-left transition-colors ${
                  activeMetricIndex === index
                    ? `${visual.tileClassName} shadow-[0_16px_50px_rgba(8,145,178,0.12)]`
                    : "border-white/5 bg-white/[0.02] hover:border-cyan-500/20"
                }`}
              >
                <div className="flex h-full flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{visual.eyebrow}</p>
                      <p className="mt-2 max-w-[8rem] text-[11px] uppercase tracking-wider text-slate-400">{metric.label}</p>
                    </div>
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-white/10 text-4xl font-black [font-family:var(--font-display)] ${visual.anchorClassName}`}
                    >
                      {visual.anchor}
                    </div>
                  </div>

                  <p
                    className={`font-bold text-white [font-family:var(--font-display)] ${
                      metric.valueClassName ?? "text-4xl"
                    }`}
                  >
                    {metric.value}
                  </p>
                </div>
              </motion.button>
            );
          })()
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
