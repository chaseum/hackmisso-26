"use client";

import { useState } from "react";
import { Clock3 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type SecurityMetric = {
  label: string;
  value: string;
  detail: string;
  valueClassName?: string;
};

type VulnerabilitySegment = {
  category: string;
  count: number;
  fillPercent: number;
  className: string;
};

function getMetricVisual(label: string) {
  if (label === "High Priority Alerts") {
    return {
      anchor: "!",
      anchorType: "text" as const,
      eyebrow: "Urgent",
      tileClassName: "border-rose-500/20 bg-[linear-gradient(145deg,rgba(251,113,133,0.14),rgba(13,17,23,0.96))]",
      anchorClassName: "bg-rose-500/12 text-rose-300",
    };
  }

  if (label === "Total Gaps") {
    return {
      anchor: "D",
      anchorType: "text" as const,
      eyebrow: "Coverage",
      tileClassName: "border-amber-400/20 bg-[linear-gradient(145deg,rgba(251,191,36,0.12),rgba(13,17,23,0.96))]",
      anchorClassName: "bg-amber-400/12 text-amber-200",
    };
  }

  if (label === "Controls Passing") {
    return {
      anchor: "A",
      anchorType: "text" as const,
      eyebrow: "Controls",
      tileClassName: "border-cyan-400/20 bg-[linear-gradient(145deg,rgba(34,211,238,0.12),rgba(13,17,23,0.96))]",
      anchorClassName: "bg-cyan-400/12 text-cyan-200",
    };
  }

  return {
    anchor: Clock3,
    anchorType: "icon" as const,
    eyebrow: "Snapshot",
    tileClassName: "border-white/10 bg-[linear-gradient(145deg,rgba(148,163,184,0.1),rgba(13,17,23,0.96))]",
    anchorClassName: "bg-white/8 text-slate-100",
  };
}

function getScoreBarClass(scorePercent: number) {
  if (scorePercent >= 80) {
    return "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.55)]";
  }

  if (scorePercent >= 60) {
    return "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]";
  }

  return "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.5)]";
}

function getCategoryBarClass(category: string) {
  if (category === "Identify") return "bg-cyan-400";
  if (category === "Protect") return "bg-emerald-400";
  if (category === "Detect") return "bg-amber-400";
  if (category === "Respond") return "bg-fuchsia-400";
  if (category === "Recover") return "bg-rose-400";
  return "bg-slate-400";
}

export function DashboardSecurityData({
  metrics,
  scorePercent,
  vulnerabilities,
}: {
  metrics: SecurityMetric[];
  scorePercent: number;
  vulnerabilities: Array<{ category: string }>;
}) {
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const activeMetric = metrics[activeMetricIndex];
  const vulnerabilitySegments: VulnerabilitySegment[] =
    vulnerabilities.length > 0
      ? Object.entries(
          vulnerabilities.reduce<Record<string, number>>((accumulator, vulnerability) => {
            accumulator[vulnerability.category] = (accumulator[vulnerability.category] ?? 0) + 1;
            return accumulator;
          }, {}),
        )
          .sort((left, right) => right[1] - left[1])
          .map(([category, count]) => ({
            category,
            count,
            fillPercent: Number(((count / vulnerabilities.length) * 100).toFixed(2)),
            className: getCategoryBarClass(category),
          }))
      : [];

  return (
    <section className="card-glass fade-up h-full space-y-8 rounded-[2.5rem] p-10" style={{ animationDelay: "0.2s" }}>
      <h2 className="border-b border-white/5 pb-5 text-lg font-bold uppercase tracking-widest text-white [font-family:var(--font-mono)]">
        Vulnerabilities
      </h2>
      <div className="grid grid-cols-2 gap-5">
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
                className={`min-h-48 rounded-[1.75rem] border p-5 text-left transition-colors ${
                  activeMetricIndex === index
                    ? `${visual.tileClassName} shadow-[0_16px_50px_rgba(8,145,178,0.12)]`
                    : "border-white/5 bg-white/[0.02] hover:border-cyan-500/20"
                }`}
              >
                <div className="flex h-full flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{visual.eyebrow}</p>
                      <p className="mt-2 max-w-[9rem] text-xs uppercase tracking-wider text-slate-400">{metric.label}</p>
                    </div>
                    <div
                      className={`flex h-18 w-18 items-center justify-center rounded-[1.25rem] border border-white/10 text-5xl font-black [font-family:var(--font-display)] ${visual.anchorClassName}`}
                    >
                      {visual.anchorType === "icon" ? <visual.anchor className="h-8 w-8" /> : visual.anchor}
                    </div>
                  </div>

                  <p
                    className={`font-bold text-white [font-family:var(--font-display)] ${
                      metric.valueClassName ?? "text-5xl"
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
            className="p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{activeMetric.label}</p>
            <p className="mt-4 text-lg leading-8 text-slate-200">{activeMetric.detail}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pt-2">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
          <div className="flex h-full w-full overflow-hidden rounded-full">
            {vulnerabilitySegments.length > 0 ? (
              vulnerabilitySegments.map((segment, index) => (
                <motion.div
                  key={segment.category}
                  className={`h-full ${segment.className} ${index === 0 ? "shadow-[0_0_12px_rgba(34,211,238,0.3)]" : ""}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${segment.fillPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.04 }}
                  title={`${segment.category}: ${segment.count} vulnerabilities`}
                />
              ))
            ) : (
              <motion.div
                className={`h-full ${getScoreBarClass(scorePercent)}`}
                initial={{ width: 0 }}
                animate={{ width: `${scorePercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
          </div>
        </div>
        {vulnerabilitySegments.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {vulnerabilitySegments.map((segment) => (
              <div
                key={segment.category}
                className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${segment.className}`} />
                {segment.category}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
