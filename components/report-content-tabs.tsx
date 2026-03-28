"use client";

import { useState } from "react";
import { ShieldAlert, Wrench } from "lucide-react";
import { FormattedAiContent } from "@/components/formatted-ai-content";
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

const SIMPLE_TERMINOLOGY_BY_REFERENCE: Record<string, string> = {
  "CIS Control 1": [
    "- What this means: Keep a current list of every company laptop, desktop, phone, and server.",
    "- In plain language: If you do not know what is connected to your systems, you cannot protect it.",
    "- Why it matters: Unknown devices create blind spots attackers can use without anyone noticing.",
  ].join("\n"),
  "ISO/IEC 27001 A.5.18": [
    "- What this means: Remove access as soon as someone leaves the organization or changes roles.",
    "- In plain language: Former staff and volunteers should not still be able to sign in.",
    "- Why it matters: Old accounts are an easy way for the wrong person to get back into email, files, or business tools.",
  ].join("\n"),
  "CIS Control 6": [
    "- What this means: Important accounts should require more than just a password to log in.",
    "- In plain language: Turn on MFA for email, finance, and admin systems.",
    "- Why it matters: If a password gets stolen, MFA can stop the attacker from getting in.",
  ].join("\n"),
  "CIS Control 7": [
    "- What this means: Devices and software should get security updates quickly and consistently.",
    "- In plain language: Do not leave computers, servers, browsers, or apps sitting unpatched.",
    "- Why it matters: Attackers often break in through old bugs that already have a fix available.",
  ].join("\n"),
  "PR.AA-01": [
    "- What this means: Only the people who truly need sensitive data should be able to access it.",
    "- In plain language: Do not give everyone access to everything.",
    "- Why it matters: If one account is compromised, limited access reduces how much damage can spread.",
  ].join("\n"),
  "CIS Control 5": [
    "- What this means: Use strong, unique passwords and store them in a secure password manager.",
    "- In plain language: Staff should not reuse passwords across work and personal accounts.",
    "- Why it matters: One leaked password should not open the door to multiple company systems.",
  ].join("\n"),
  "PR.AT-01": [
    "- What this means: Train people regularly so they can spot phishing, scams, and suspicious requests.",
    "- In plain language: Employees need practice recognizing bad emails before they click.",
    "- Why it matters: Human mistakes are one of the easiest ways attackers get inside.",
  ].join("\n"),
  "CIS Control 10": [
    "- What this means: Every company device should have active malware protection running.",
    "- In plain language: Laptops and desktops need up-to-date antivirus or endpoint protection.",
    "- Why it matters: These tools help catch malicious files and suspicious behavior before it spreads.",
  ].join("\n"),
  "RS.RP-01": [
    "- What this means: Have a written plan for what to do when something goes wrong.",
    "- In plain language: The team should know who responds, what gets shut down, and who gets contacted first.",
    "- Why it matters: A clear response plan saves time and reduces panic during a real incident.",
  ].join("\n"),
  "RC.RP-01": [
    "- What this means: Back up important data in a separate place so you can recover after an attack or mistake.",
    "- In plain language: Keep copies of key data where ransomware or accidental deletion cannot wipe everything out.",
    "- Why it matters: Good backups can keep the organization operating instead of starting from scratch.",
  ].join("\n"),
};

function summarizeFrameworkExcerpt(reference: string, excerpt: string) {
  return SIMPLE_TERMINOLOGY_BY_REFERENCE[reference] ?? [
    `- What this means: ${excerpt.replace(/\s+/g, " ").trim()}`,
    "- In plain language: This control is asking the organization to put a basic security safeguard in place and keep using it consistently.",
  ].join("\n");
}

function formatFrameworkExplanation(excerpt: string) {
  return excerpt
    .replace(/\s+/g, " ")
    .replace(/([A-Z][A-Z ]+:\s*)/g, "\n\n$1")
    .trim();
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
                    <FormattedAiContent
                      content={summarizeFrameworkExcerpt(framework.frameworkReference, framework.frameworkExcerpt)}
                      className="mt-3 space-y-3 text-base text-slate-100"
                    />
                  </div>
                  <details className="mt-5 rounded-2xl border border-white/5 bg-[#020912] px-5 py-4 text-slate-300">
                    <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-slate-200">
                      Full framework explanation
                    </summary>
                    <FormattedAiContent content={formatFrameworkExplanation(framework.frameworkExcerpt)} className="mt-4 space-y-3 text-sm text-slate-400" />
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
                      <FormattedAiContent content={item.actionableFix} className="space-y-3" />
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
