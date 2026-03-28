import Link from "next/link";
import { Download } from "lucide-react";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { ReportContentTabs } from "@/components/report-content-tabs";
import { ReportActionAssistantModal } from "@/components/report-action-assistant-modal";
import { SetupNotice } from "@/components/site";
import { getAllQuestions } from "@/lib/assessment-dal";
import { getLatestAssessmentReportData } from "@/lib/assessment-report";
import { createServerClientSafe, hasSupabaseEnv } from "@/lib/supabase";

export default async function ReportPage() {
  if (!hasSupabaseEnv()) return <SetupNotice />;

  const supabase = await createServerClientSafe();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const report = user ? await getLatestAssessmentReportData() : null;
  const questions = user ? await getAllQuestions() : [];
  const hasAssessment = Boolean(report?.assessment);
  const frameworks = Array.from(
    new Map(
      questions.map((question) => [
        question.framework_reference,
        {
          frameworkName: question.framework_name,
          frameworkReference: question.framework_reference,
          frameworkExcerpt: question.framework_excerpt,
        },
      ]),
    ).values(),
  );

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

      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-8 py-14">
        <section className="flex flex-col gap-8 border-b border-white/5 pb-12 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="text-sm uppercase tracking-[0.32em] text-cyan-400 [font-family:var(--font-mono)]">
              SeKeyity Action Report
            </div>
            <h1 className="text-6xl font-bold tracking-tight text-white [font-family:var(--font-display)] md:text-7xl xl:text-[5.75rem]">
              What do I do now?
            </h1>
            <p className="max-w-4xl text-xl leading-9 text-slate-300 md:text-2xl">
              Action page for <span className="font-medium text-white">{report?.orgName ?? "your organization"}</span>. Review the failed frameworks, then use the chatbot to turn them into an achievable plan.
            </p>
          </div>

          <a
            href="/api/report/pdf"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-base font-bold text-white transition-all hover:bg-white/10"
          >
            <Download className="h-5 w-5" />
            Export report PDF
          </a>
        </section>

        <ReportContentTabs
          recommendations={report?.recommendations ?? []}
          vulnerabilities={report?.vulnerabilities ?? []}
          frameworks={frameworks}
        />

        <Link href="/knowledge-base" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 transition-colors hover:text-cyan-300">
          Back to data page
        </Link>
      </main>
      {hasAssessment ? <ReportActionAssistantModal assessmentResults={chatPayload} mode="floating" /> : null}
    </div>
  );
}
