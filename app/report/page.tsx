import Link from "next/link";
import { Download, ShieldAlert, Wrench } from "lucide-react";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { RecommendationBrowser } from "@/components/recommendation-browser";
import { ReportActionAssistantModal } from "@/components/report-action-assistant-modal";
import { SetupNotice } from "@/components/site";
import { getLatestAssessmentReportData } from "@/lib/assessment-report";
import { makeRiskSlug } from "@/lib/risk-links";
import { createServerClientSafe, hasSupabaseEnv } from "@/lib/supabase";

function priorityClass(priority?: "high" | "medium" | "low") {
  if (priority === "high") return "bg-orange-500/10 text-orange-500";
  if (priority === "medium") return "bg-yellow-500/10 text-yellow-500";
  return "bg-cyan-500/10 text-cyan-500";
}

export default async function ReportPage() {
  if (!hasSupabaseEnv()) return <SetupNotice />;

  const supabase = await createServerClientSafe();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const report = user ? await getLatestAssessmentReportData() : null;
  const hasAssessment = Boolean(report?.assessment);

  const chatPayload = {
    scorePercent: report?.scorePercent ?? 0,
    postureLabel: report?.postureLabel ?? "Needs attention",
    recommendations: report?.recommendations ?? [],
    vulnerabilities: report?.vulnerabilities ?? [],
  };

  return (
    <div className="grid-bg paper-grid-bg relative flex min-h-screen flex-col bg-[#010409] text-slate-300">
      <NeuralSecHeader
        activeItem="mission"
        dashboardHref="/dashboard"
        resourcesHref="/knowledge-base"
        missionHref="/report"
        ctaHref={hasAssessment ? "/questionnaire" : "/prequestionnaire"}
        ctaLabel={hasAssessment ? "Restart Assessment" : "Start Assessment"}
        showLogout={Boolean(user)}
      />

      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-8 py-10">
        <section className="flex flex-col gap-6 border-b border-white/5 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-400 [font-family:var(--font-mono)]">
              SeKeyity Action Report
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-white [font-family:var(--font-display)]">
              What do I do now?
            </h1>
            <p className="max-w-3xl text-lg text-slate-300">
              Action page for <span className="font-medium text-white">{report?.orgName ?? "your organization"}</span>. Review the failed frameworks, then use the chatbot to turn them into an achievable plan.
            </p>
          </div>

          <a
            href="/api/report/pdf"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            Export report PDF
          </a>
        </section>

        <section className="flex flex-wrap items-center gap-4">
          <a
            href="#recommended-actions"
            className="inline-flex items-center rounded-full border border-cyan-500/25 bg-cyan-500/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-cyan-200 transition-colors hover:bg-cyan-500/15"
          >
            Recommendations
          </a>
          <a
            href="#failed-frameworks"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-100 transition-colors hover:bg-white/[0.06]"
          >
            Failed Frameworks
          </a>
        </section>

        <section className="grid gap-6">
          <div className="space-y-6">
            <section id="recommended-actions" className="card-glass rounded-[2rem] p-8">
              <div className="mb-4 flex items-center gap-3">
                <Wrench className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-bold uppercase tracking-widest text-white [font-family:var(--font-mono)]">
                  Recommended Actions
                </h2>
              </div>

              <RecommendationBrowser recommendations={report?.recommendations ?? []} />
            </section>

            <section id="failed-frameworks" className="card-glass rounded-[2rem] p-8">
              <div className="mb-4 flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-bold uppercase tracking-widest text-white [font-family:var(--font-mono)]">
                  Failed Frameworks
                </h2>
              </div>

              <div className="space-y-4">
                {report?.vulnerabilities.length ? (
                  report.vulnerabilities.map((item) => (
                    <article
                      key={item.questionId}
                      id={`risk-${makeRiskSlug({ frameworkReference: item.frameworkReference, title: item.title })}`}
                      className="scroll-mt-28 rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-5"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${priorityClass(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-base leading-7 text-slate-200">{item.description}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        <span>{item.category}</span>
                        <span>{item.frameworkReference}</span>
                        <span>{item.frameworkName}</span>
                      </div>
                      {item.actionableFix ? (
                        <div className="mt-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4 text-base leading-7 text-slate-200">
                          {item.actionableFix}
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-5 text-sm text-slate-400">
                    No vulnerabilities are listed yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>

        <Link href="/knowledge-base" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 transition-colors hover:text-cyan-300">
          Back to data page
        </Link>
      </main>
      {hasAssessment ? <ReportActionAssistantModal assessmentResults={chatPayload} mode="floating" /> : null}
    </div>
  );
}
