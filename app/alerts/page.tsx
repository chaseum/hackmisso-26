import Link from "next/link";
import { BellRing } from "lucide-react";
import { AlertsMitigationBoard } from "@/components/alerts-mitigation-board";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { SetupNotice } from "@/components/site";
import { getSecurityScore } from "@/lib/assessment-report";
import { getLatestAssessmentReportData } from "@/lib/assessment-report";
import { createServerClientSafe, hasSupabaseEnv } from "@/lib/supabase";

export default async function AlertsPage() {
  if (!hasSupabaseEnv()) {
    return <SetupNotice />;
  }

  const supabase = await createServerClientSafe();
  if (!supabase) {
    return <SetupNotice />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const report = user ? await getLatestAssessmentReportData() : null;
  const baseSecurityScore = getSecurityScore(report?.scorePercent ?? 0);

  return (
    <div className="grid-bg relative flex min-h-screen flex-col bg-[#010409] text-slate-300">
      <NeuralSecHeader
        activeItem="dashboard"
        dashboardHref="/dashboard"
        resourcesHref="/knowledge-base"
        missionHref="/mission-control"
        ctaHref={report?.assessment ? "/questionnaire" : "/prequestionnaire"}
        ctaLabel={report?.assessment ? "Retake Assessment" : "Start Scan"}
        showLogout={Boolean(user)}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-8 py-10">
        <section className="border-b border-white/5 pb-8">
          <div className="flex items-center gap-3 text-cyan-400">
            <BellRing className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.3em] [font-family:var(--font-mono)]">Full Alert Log</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white [font-family:var(--font-display)]">
            View All Alerts
          </h1>
          <p className="mt-2 text-slate-400">
            Complete, unfiltered alert list from the latest assessment output, ordered by risk priority.
          </p>
        </section>

        <AlertsMitigationBoard alerts={report?.alerts ?? []} baseSecurityScore={baseSecurityScore} />

        <div>
          <Link href="/report" className="text-sm font-bold text-cyan-400 transition-colors hover:text-cyan-300">
            Open recommendations
          </Link>
        </div>
      </main>
    </div>
  );
}
