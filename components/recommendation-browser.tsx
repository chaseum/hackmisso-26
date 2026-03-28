"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { AssessmentRecommendation } from "@/types/database";

function priorityClass(priority?: "high" | "medium" | "low") {
  if (priority === "high") {
    return "bg-orange-500/10 text-orange-500";
  }

  if (priority === "medium") {
    return "bg-yellow-500/10 text-yellow-500";
  }

  return "bg-cyan-500/10 text-cyan-500";
}

export function RecommendationBrowser({ recommendations }: { recommendations: AssessmentRecommendation[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRecommendation = recommendations[activeIndex];

  if (recommendations.length === 0 || !activeRecommendation) {
    return (
      <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-5 text-sm text-slate-400">
        No recommendations are available yet. Run a scan to generate the full remediation guide.
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <motion.button
            key={`${recommendation.framework_reference ?? recommendation.title}-${recommendation.title}`}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveIndex(index)}
            className={`w-full rounded-[1.25rem] border p-4 text-left transition-colors ${
              activeIndex === index
                ? "border-cyan-500/30 bg-cyan-500/10"
                : "border-white/5 bg-white/[0.03] hover:border-cyan-500/20"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{recommendation.title}</p>
              <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${priorityClass(recommendation.priority)}`}>
                {recommendation.priority ?? "low"}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-white/[0.03]">
        <AnimatePresence mode="wait">
          <motion.article
            key={`${activeRecommendation.framework_reference ?? activeRecommendation.title}-${activeIndex}`}
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
      </div>
    </div>
  );
}
