"use client";

import { useState } from "react";
import { ShieldAlert, Wrench } from "lucide-react";
import { RecommendationBrowser } from "@/components/recommendation-browser";
import { makeRiskSlug } from "@/lib/risk-links";
import type { AssessmentRecommendation } from "@/types/database";

type ReportVulnerability = {
  questionId: string;
  title: string;
  description: string;
  category: string;
  frameworkName: string;
  frameworkReference: string;
  priority: "high" | "medium" | "low";
  actionableFix?: string;
};

type FrameworkReference = {
  frameworkName: string;
  frameworkReference: string;
  frameworkExcerpt: string;
};

function summarizeFrameworkExcerpt(excerpt: string) {
  const normalized = excerpt.replace(/\s+/g, " ").trim();
  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] ?? normalized;
  const candidate = firstSentence.length > 150 ? `${firstSentence.slice(0, 147).trimEnd()}...` : firstSentence;

  return candidate || "Plain-English summary unavailable for this framework.";
}

function priorityClass(priority?: "high" | "medium" | "low") {
  if (priority === "high") return "bg-orange-500/10 text-orange-500";
  if (priority === "medium") return "bg-yellow-500/10 text-yellow-500";
  return "bg-cyan-500/10 text-cyan-500";
}

export function ReportContentTabs({
  recommendations,
  vulnerabilities,
  frameworks,
}: {
  recommendations: AssessmentRecommendation[];
  vulnerabilities: ReportVulnerability[];
  frameworks: FrameworkReference[];
}) {
  const [activeTab, setActiveTab] = useState<"recommendations" | "failed">("recommendations");

  return (
    <section className="grid gap-8">
      <section className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => setActiveTab("recommendations")}
          className={`rounded-full px-6 py-3.5 text-base font-bold uppercase tracking-[0.18em] transition-colors ${
            activeTab === "recommendations"
              ? "border border-cyan-500/25 bg-cyan-500/10 text-cyan-200"
              : "border border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.06]"
          }`}
        >
          Recommendations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("failed")}
          className={`rounded-full px-6 py-3.5 text-base font-bold uppercase tracking-[0.18em] transition-colors ${
            activeTab === "failed"
              ? "border border-cyan-500/25 bg-cyan-500/10 text-cyan-200"
              : "border border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.06]"
          }`}
        >
          Failed Frameworks
        </button>
      </section>

      {activeTab === "recommendations" ? (
        <div className="space-y-8">
          <section className="card-glass rounded-[2rem] p-10">
            <div className="mb-6 flex items-center gap-3">
              <Wrench className="h-6 w-6 text-cyan-400" />
              <h2 className="text-lg font-bold uppercase tracking-widest text-white [font-family:var(--font-mono)]">
                Recommended Actions
              </h2>
            </div>

            <RecommendationBrowser recommendations={recommendations} />
          </section>

          <section className="card-glass rounded-[2rem] p-10">
            <div className="mb-6">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white [font-family:var(--font-mono)]">
                Framework Library
              </h2>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-300">
                Reference the full set of frameworks used in the assessment, not just the ones that failed.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {frameworks.map((framework) => (
                <article key={framework.frameworkReference} className="rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-7">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-2xl font-semibold text-white">{framework.frameworkName}</h3>
                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200">
                      {framework.frameworkReference}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">Simple terminology</p>
                    <p className="mt-3 text-base leading-7 text-slate-100">{summarizeFrameworkExcerpt(framework.frameworkExcerpt)}</p>
                  </div>
                  <details className="mt-5 rounded-2xl border border-white/5 bg-[#020912] px-5 py-4 text-slate-300">
                    <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-slate-200">
                      Full framework explanation
                    </summary>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{framework.frameworkExcerpt}</p>
                  </details>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="card-glass rounded-[2rem] p-10">
          <div className="mb-6 flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-cyan-400" />
            <h2 className="text-lg font-bold uppercase tracking-widest text-white [font-family:var(--font-mono)]">
              Failed Frameworks
            </h2>
          </div>

          <div className="space-y-6">
            {vulnerabilities.length > 0 ? (
              vulnerabilities.map((item) => (
                <article
                  key={item.questionId}
                  id={`risk-${makeRiskSlug({ frameworkReference: item.frameworkReference, title: item.title })}`}
                  className="scroll-mt-28 rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-7"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
                    <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] ${priorityClass(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-lg leading-8 text-slate-200">{item.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    <span>{item.category}</span>
                    <span>{item.frameworkReference}</span>
                    <span>{item.frameworkName}</span>
                  </div>
                  {item.actionableFix ? (
                    <div className="mt-5 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-5 text-lg leading-8 text-slate-200">
                      {item.actionableFix}
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-7 text-base text-slate-400">
                No vulnerabilities are listed yet.
              </div>
            )}
          </div>
        </section>
      )}
    </section>
  );
}
