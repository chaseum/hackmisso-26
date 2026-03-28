"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Copy, Loader2, Sparkles } from "lucide-react";
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
type DraftPolicyKind = "password-policy" | "data-breach-response-plan";

type DraftState = {
  content: string;
  isLoading: boolean;
  error: string | null;
  copied: boolean;
};

function getRecommendationKey(recommendation: AssessmentRecommendation) {
  return `${recommendation.framework_reference ?? recommendation.title}-${recommendation.title}`;
}

function getDraftPolicyKind(recommendation: AssessmentRecommendation): DraftPolicyKind | null {
  const combinedText = [
    recommendation.title,
    recommendation.why_it_matters,
    recommendation.actionable_fix,
    recommendation.framework_reference,
  ]
    .join(" ")
    .toLowerCase();

  if (/(password policy|weak password|password practice|password hygiene|identity|mfa)/.test(combinedText)) {
    return "password-policy";
  }

  if (/(data breach|incident response|breach response|security incident|respond)/.test(combinedText)) {
    return "data-breach-response-plan";
  }

  return null;
}

function getDraftLabel(policyKind: DraftPolicyKind) {
  return policyKind === "password-policy" ? "Password Policy" : "Data Breach Response Plan";
}

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
  const [draftStates, setDraftStates] = useState<Record<string, DraftState>>({});
  const activeRecommendations = groupedRecommendations[activeTimeframe];
  const activeRecommendation = activeRecommendations[activeIndices[activeTimeframe]] ?? activeRecommendations[0];
  const activeRecommendationKey = activeRecommendation ? getRecommendationKey(activeRecommendation) : null;
  const activePolicyKind = activeRecommendation ? getDraftPolicyKind(activeRecommendation) : null;
  const activeDraftState = activeRecommendationKey ? draftStates[activeRecommendationKey] : undefined;

  async function handleGenerateDraftPolicy(recommendation: AssessmentRecommendation, policyKind: DraftPolicyKind) {
    const recommendationKey = getRecommendationKey(recommendation);

    setDraftStates((current) => ({
      ...current,
      [recommendationKey]: {
        content: "",
        isLoading: true,
        error: null,
        copied: false,
      },
    }));

    try {
      const response = await fetch("/api/policy-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policyKind,
          recommendationTitle: recommendation.title,
          frameworkReference: recommendation.framework_reference,
        }),
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to generate a draft policy.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;

        if (result.value) {
          const chunk = decoder.decode(result.value, { stream: !done });
          setDraftStates((current) => {
            const existing = current[recommendationKey] ?? {
              content: "",
              isLoading: true,
              error: null,
              copied: false,
            };

            return {
              ...current,
              [recommendationKey]: {
                ...existing,
                content: `${existing.content}${chunk}`,
              },
            };
          });
        }
      }

      setDraftStates((current) => ({
        ...current,
        [recommendationKey]: {
          ...(current[recommendationKey] ?? {
            content: "",
            copied: false,
          }),
          isLoading: false,
          error: null,
        },
      }));
    } catch (error) {
      setDraftStates((current) => ({
        ...current,
        [recommendationKey]: {
          ...(current[recommendationKey] ?? {
            content: "",
            copied: false,
          }),
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to generate a draft policy.",
        },
      }));
    }
  }

  async function handleCopyDraft(recommendationKey: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setDraftStates((current) => ({
        ...current,
        [recommendationKey]: {
          ...(current[recommendationKey] ?? {
            content,
            isLoading: false,
            error: null,
          }),
          copied: true,
        },
      }));

      window.setTimeout(() => {
        setDraftStates((current) => {
          const existing = current[recommendationKey];
          if (!existing) {
            return current;
          }

          return {
            ...current,
            [recommendationKey]: {
              ...existing,
              copied: false,
            },
          };
        });
      }, 1600);
    } catch {
      setDraftStates((current) => ({
        ...current,
        [recommendationKey]: {
          ...(current[recommendationKey] ?? {
            content,
            isLoading: false,
          }),
          error: "Could not copy the draft. Select and copy it manually.",
          copied: false,
        },
      }));
    }
  }

  if (recommendations.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-5 text-sm text-slate-400">
        No recommendations are available yet. Run a scan to generate the full remediation guide.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {TIMEFRAME_CONFIG.map((timeframe) => {
          const isActive = activeTimeframe === timeframe.id;
          const count = groupedRecommendations[timeframe.id].length;

          return (
            <button
              key={timeframe.id}
              type="button"
              onClick={() => setActiveTimeframe(timeframe.id)}
              className={`rounded-[1.5rem] border px-6 py-5 text-left transition-colors ${
                isActive
                  ? "border-cyan-500/35 bg-cyan-500/10"
                  : "border-white/5 bg-white/[0.03] hover:border-cyan-500/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-white">{timeframe.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{timeframe.description}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300">
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
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
                className={`w-full rounded-[1.25rem] border p-5 text-left transition-colors ${
                  recommendation === activeRecommendation
                    ? "border-cyan-500/30 bg-cyan-500/10"
                    : "border-white/5 bg-white/[0.03] hover:border-cyan-500/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-white">{recommendation.title}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${priorityClass(recommendation.priority)}`}
                  >
                    {recommendation.priority ?? "low"}
                  </span>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-base leading-7 text-slate-400">
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
                className="p-8"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-3xl font-semibold text-white">{activeRecommendation.title}</h3>
                  <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] ${priorityClass(activeRecommendation.priority)}`}>
                    {activeRecommendation.priority ?? "low"}
                  </span>
                </div>
                <p className="text-base leading-8 text-slate-300">{activeRecommendation.why_it_matters}</p>
                <motion.div
                  initial={{ opacity: 0.4, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.06 }}
                  className="mt-5 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-5 text-base leading-8 text-cyan-100"
                >
                  {activeRecommendation.actionable_fix}
                </motion.div>
                {activeRecommendation.framework_reference ? (
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {activeRecommendation.framework_reference}
                  </p>
                ) : null}

                {activePolicyKind ? (
                  <section className="mt-8 rounded-[1.75rem] border border-emerald-400/15 bg-emerald-500/[0.05] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                          <Sparkles className="h-4 w-4" />
                          1-Click Policy Generator
                        </div>
                        <h4 className="mt-2 text-xl font-semibold text-white">
                          Generate Draft {getDraftLabel(activePolicyKind)}
                        </h4>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                          Build a customized draft using the latest organization profile and stream it directly into this dashboard view.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={Boolean(activeDraftState?.isLoading)}
                        onClick={() => handleGenerateDraftPolicy(activeRecommendation, activePolicyKind)}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-100 transition-colors hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {activeDraftState?.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {activeDraftState?.content ? "Regenerate Draft Policy" : "Generate Draft Policy"}
                      </button>
                    </div>

                    {activeDraftState?.error ? (
                      <p className="mt-4 text-sm text-rose-300">{activeDraftState.error}</p>
                    ) : null}

                    {activeDraftState?.content || activeDraftState?.isLoading ? (
                      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#04111a]">
                        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                            {getDraftLabel(activePolicyKind)} Draft
                          </p>
                          {activeDraftState?.content ? (
                            <button
                              type="button"
                              onClick={() => handleCopyDraft(activeRecommendationKey!, activeDraftState.content)}
                              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-200 transition-colors hover:text-white"
                            >
                              <Copy className="h-4 w-4" />
                              {activeDraftState.copied ? "Copied" : "Copy Draft"}
                            </button>
                          ) : null}
                        </div>
                        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap px-4 py-4 text-sm leading-7 text-slate-100">
                          {activeDraftState?.content}
                          {activeDraftState?.isLoading ? (
                            <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-emerald-200 align-middle" />
                          ) : null}
                        </pre>
                      </div>
                    ) : null}
                  </section>
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
