import Link from "next/link";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { ReportActionAssistantModal } from "@/components/report-action-assistant-modal";
import { SetupNotice } from "@/components/site";
import { getLatestAssessmentReportData } from "@/lib/assessment-report";
import { makeRiskHref } from "@/lib/risk-links";
import { createServerClientSafe } from "@/lib/supabase";

function getPriorityBadge(priority: "high" | "medium" | "low") {
  if (priority === "high") {
    return {
      wrapper: "border-rose-500/20 bg-rose-500/10 text-rose-300",
      icon: ShieldAlert,
      iconClassName: "text-rose-300",
      label: "High",
    };
  }

  if (priority === "medium") {
    return {
      wrapper: "border-amber-500/20 bg-amber-500/10 text-amber-300",
      icon: AlertTriangle,
      iconClassName: "text-amber-300",
      label: "Medium",
    };
  }

  return {
    wrapper: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    icon: CheckCircle2,
    iconClassName: "text-emerald-300",
    label: "Low",
  };
}

export default async function KnowledgeBasePage() {
  const supabase = await createServerClientSafe();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const report = user ? await getLatestAssessmentReportData() : null;
  const vulnerabilities = report?.vulnerabilities ?? [];
  const hasAssessment = Boolean(report?.assessment);
  const chatPayload = {
    scorePercent: report?.scorePercent ?? 0,
    postureLabel: report?.postureLabel ?? "Needs attention",
    recommendations: report?.recommendations ?? [],
    vulnerabilities: report?.vulnerabilities ?? [],
  };

  return (
    <div className="homepage-grid paper-grid-bg relative flex min-h-screen flex-col bg-[#010409] text-slate-300">
      <NeuralSecHeader
        activeItem="resources"
        dashboardHref="/dashboard"
        resourcesHref="/knowledge-base"
        missionHref="/report"
        ctaHref={hasAssessment ? "/questionnaire" : "/prequestionnaire"}
        ctaLabel={hasAssessment ? "Restart Assessment" : "Start Assessment"}
        showLogout={Boolean(user)}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-8 py-14">
        <section className="border-b border-white/5 pb-12">
          <div className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-300 [font-family:var(--font-mono)]">
            Active Vulnerabilities
          </div>
          <h1 className="mt-4 text-6xl font-bold tracking-tight text-white [font-family:var(--font-display)] md:text-7xl xl:text-[5.75rem]">
            Let&apos;s find the gaps.
          </h1>
          <p className="mt-4 max-w-4xl text-xl leading-9 text-slate-300 md:text-2xl">
            This screen is for investigation. Review the alert cards, inspect the failed controls, and then move to the AI action assistant when you are ready to act.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {vulnerabilities.length > 0 ? (
            vulnerabilities.map((item) => {
              const badge = getPriorityBadge(item.priority);
              const PriorityIcon = badge.icon;

              return (
                <Link
                  key={item.questionId}
                  href={makeRiskHref({ frameworkReference: item.frameworkReference, title: item.title })}
                  className="resource-card group rounded-[1.75rem] p-8 hover:bg-white/[0.04]"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${badge.wrapper}`}>
                      <PriorityIcon className={`h-4 w-4 ${badge.iconClassName}`} />
                      {badge.label}
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.frameworkReference}</span>
                  </div>

                  <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
                  <p className="mt-4 text-base leading-8 text-slate-400">{item.description}</p>

                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-5 text-[11px] font-bold uppercase tracking-[0.18em]">
                    <span className="text-slate-500">{item.category}</span>
                    <span className="text-cyan-300 transition-colors group-hover:text-cyan-200">Open in recommendations</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="resource-card rounded-[1.75rem] p-8 text-base text-slate-400">
              No alerts are available yet. Start an assessment to generate the data page.
            </div>
          )}
        </section>

      </main>
      {hasAssessment ? <ReportActionAssistantModal assessmentResults={chatPayload} mode="floating" /> : null}
    </div>
  );
}
