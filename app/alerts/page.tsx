import Link from "next/link";
import { BellRing } from "lucide-react";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { SetupNotice } from "@/components/site";
import { getLatestAssessmentReportData } from "@/lib/assessment-report";
import { makeRiskHref } from "@/lib/risk-links";
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

        <section className="space-y-4">
          {report?.alerts.length ? (
            report.alerts.map((alert) => (
              <Link
                key={`${alert.level}-${alert.title}`}
                href={makeRiskHref({ frameworkReference: alert.frameworkReference, title: alert.title })}
                className="card-glass block rounded-[1.5rem] p-5 transition-colors hover:bg-white/[0.06]"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${alert.levelClassName}`}>
                      {alert.level}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      {alert.frameworkReference ?? "Assessment"}
                    </span>
                  </div>
                </div>
                <h2 className="text-base font-semibold text-white">{alert.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{alert.description}</p>
              </Link>
            ))
          ) : (
            <div className="card-glass rounded-[1.5rem] p-5 text-sm text-slate-400">
              No alerts are available yet. Run a scan first.
            </div>
          )}
        </section>

        <div>
          <Link href="/report" className="text-sm font-bold text-cyan-400 transition-colors hover:text-cyan-300">
            Open recommendations
          </Link>
        </div>
      </main>
    </div>
  );
}
