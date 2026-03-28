"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { AssessmentRecommendation } from "@/types/database";

const TIMEFRAME_CONFIG = [
  {
    id: "immediate",
    label: "Immediate Action",
    description: "Urgent fixes that reduce exposure quickly.",
  },
  {
    id: "thirty-day",
    label: "30-Day Plan",
    description: "Near-term work to stabilize weak controls.",
  },
  {
    id: "long-term",
    label: "Long-Term Goals",
    description: "Structural improvements that compound over time.",
  },
] as const;

type TimeframeId = (typeof TIMEFRAME_CONFIG)[number]["id"];

function priorityClass(priority?: "high" | "medium" | "low") {
  if (priority === "high") {
    return "bg-orange-500/10 text-orange-500";
  }

  if (priority === "medium") {
    return "bg-yellow-500/10 text-yellow-500";
  }

  return "bg-cyan-500/10 text-cyan-500";
}

function pickTimeframe(recommendation: AssessmentRecommendation): TimeframeId {
  const combinedText = [
    recommendation.title,
    recommendation.why_it_matters,
    recommendation.actionable_fix,
  ]
    .join(" ")
    .toLowerCase();

  if (/(immediately|urgent|today|asap|critical|now)/.test(combinedText)) {
    return "immediate";
  }

  if (recommendation.priority === "high") {
    return "immediate";
  }

  if (recommendation.priority === "medium") {
    return "thirty-day";
  }

  return "long-term";
}

export function RecommendationBrowser({ recommendations }: { recommendations: AssessmentRecommendation[] }) {
  const groupedRecommendations = useMemo(
    () =>
      recommendations.reduce<Record<TimeframeId, AssessmentRecommendation[]>>(
        (accumulator, recommendation) => {
          const timeframe = pickTimeframe(recommendation);
          accumulator[timeframe].push(recommendation);
          return accumulator;
        },
        {
          immediate: [],
          "thirty-day": [],
          "long-term": [],
        },
      ),
    [recommendations],
  );
  const [activeTimeframe, setActiveTimeframe] = useState<TimeframeId>("immediate");
  const [activeIndices, setActiveIndices] = useState<Record<TimeframeId, number>>({
    immediate: 0,
    "thirty-day": 0,
    "long-term": 0,
  });
  const activeRecommendations = groupedRecommendations[activeTimeframe];
  const activeRecommendation = activeRecommendations[activeIndices[activeTimeframe]] ?? activeRecommendations[0];

  if (recommendations.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-5 text-sm text-slate-400">
        No recommendations are available yet. Run a scan to generate the full remediation guide.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {TIMEFRAME_CONFIG.map((timeframe) => {
          const isActive = activeTimeframe === timeframe.id;
          const count = groupedRecommendations[timeframe.id].length;

          return (
            <button
              key={timeframe.id}
              type="button"
              onClick={() => setActiveTimeframe(timeframe.id)}
              className={`rounded-[1.5rem] border px-5 py-4 text-left transition-colors ${
                isActive
                  ? "border-cyan-500/35 bg-cyan-500/10"
                  : "border-white/5 bg-white/[0.03] hover:border-cyan-500/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">{timeframe.label}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{timeframe.description}</p>
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-3">
          {activeRecommendations.length > 0 ? (
            activeRecommendations.map((recommendation, index) => (
              <motion.button
                key={`${activeTimeframe}-${recommendation.framework_reference ?? recommendation.title}-${recommendation.title}`}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  setActiveIndices((current) => ({
                    ...current,
                    [activeTimeframe]: index,
                  }))
                }
                className={`w-full rounded-[1.25rem] border p-4 text-left transition-colors ${
                  recommendation === activeRecommendation
                    ? "border-cyan-500/30 bg-cyan-500/10"
                    : "border-white/5 bg-white/[0.03] hover:border-cyan-500/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{recommendation.title}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${priorityClass(recommendation.priority)}`}
                  >
                    {recommendation.priority ?? "low"}
                  </span>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-slate-400">
              No recommendations are currently grouped into this timeframe. Switch tabs to review the rest of the remediation guide.
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-white/[0.03]">
          {activeRecommendation ? (
            <AnimatePresence mode="wait">
              <motion.article
                key={`${activeTimeframe}-${activeRecommendation.framework_reference ?? activeRecommendation.title}-${activeIndices[activeTimeframe]}`}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="p-6"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-white">{activeRecommendation.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${priorityClass(activeRecommendation.priority)}`}>
                    {activeRecommendation.priority ?? "low"}
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-300">{activeRecommendation.why_it_matters}</p>
                <motion.div
                  initial={{ opacity: 0.4, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.06 }}
                  className="mt-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4 text-sm leading-6 text-cyan-100"
                >
                  {activeRecommendation.actionable_fix}
                </motion.div>
                {activeRecommendation.framework_reference ? (
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {activeRecommendation.framework_reference}
                  </p>
                ) : null}
              </motion.article>
            </AnimatePresence>
          ) : (
            <div className="p-6 text-sm leading-6 text-slate-400">
              No detail view is available for this timeframe yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
