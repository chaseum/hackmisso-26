import Link from "next/link";
import { Download, ShieldPlus } from "lucide-react";
import { DashboardSecurityData } from "@/components/dashboard-security-data";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { SetupNotice } from "@/components/site";
import { getLatestAssessmentReportData } from "@/lib/assessment-report";
import { createServerClientSafe, hasSupabaseEnv } from "@/lib/supabase";

type MetricCard = {
  label: string;
  value: string;
  detail: string;
  valueClassName?: string;
};

function formatRelativeAssessmentDate(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function formatAssessmentTimestamp(createdAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

function getGaugeOffset(scorePercent: number) {
  const circumference = 283;
  return Number((circumference * (1 - scorePercent / 100)).toFixed(2));
}

function getPostureAccent(scorePercent: number) {
  if (scorePercent <= 20) return "border-cyan-500/20 bg-cyan-500/10 text-cyan-400";
  if (scorePercent <= 40) return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
  return "border-rose-500/20 bg-rose-500/10 text-rose-300";
}

function getGaugeStroke(scorePercent: number) {
  if (scorePercent <= 20) return "#22d3ee";
  if (scorePercent <= 40) return "#fbbf24";
  return "#fb7185";
}

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) return <SetupNotice />;

  const supabase = await createServerClientSafe();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const report = user ? await getLatestAssessmentReportData() : null;
  const assessment = report?.assessment ?? null;
  const vulnerabilities = report?.vulnerabilities ?? [];
  const scorePercent = report?.scorePercent ?? 0;
  const postureLabel = report?.postureLabel ?? "Needs attention";
  const postureAccent = getPostureAccent(scorePercent);
  const orgName = report?.orgName ?? "your organization";
  const hasAssessment = Boolean(assessment);
  const metricCards: MetricCard[] = [
    {
      label: "High Priority Alerts",
      value: String(vulnerabilities.filter((item) => item.priority === "high").length),
      detail: "These are the most urgent issues from the latest scan and should be reviewed first.",
      valueClassName: "text-rose-400 text-3xl",
    },
    {
      label: "Total Gaps",
      value: String(vulnerabilities.length),
      detail: "All identified control gaps from the latest assessment snapshot.",
    },
    {
      label: "Controls Passing",
      value: String(assessment?.raw_responses.filter((response) => response.userAnsweredYes).length ?? 0),
      detail: "Controls currently reported as implemented and operating effectively.",
      valueClassName: "text-cyan-300 text-3xl",
    },
    {
      label: "Last Assessment",
      value: assessment ? formatRelativeAssessmentDate(assessment.created_at) : "Not yet run",
      detail: assessment
        ? `Latest assessment submitted on ${formatAssessmentTimestamp(assessment.created_at)}.`
        : "No assessment has been submitted yet for this account.",
      valueClassName: "pt-2 text-sm font-medium",
    },
  ];
  const gaugeOffset = getGaugeOffset(scorePercent);

  return (
    <div className="grid-bg relative flex min-h-screen flex-col bg-[#010409] text-slate-300">
      <NeuralSecHeader
        activeItem="dashboard"
        dashboardHref="/dashboard"
        resourcesHref="/knowledge-base"
        missionHref="/report"
        ctaHref={hasAssessment ? "/questionnaire" : "/prequestionnaire"}
        ctaLabel={hasAssessment ? "Restart Assessment" : "Start Assessment"}
        showLogout={Boolean(user)}
      />

      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-8 py-10">
        <section className="fade-up flex flex-col items-start justify-between gap-6 border-b border-white/5 pb-8 md:flex-row md:items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-400 [font-family:var(--font-mono)]">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Command Center
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-white [font-family:var(--font-display)]">
              How bad is security today?
            </h1>
            <p className="text-lg text-slate-300">
              Fast triage for <span className="font-medium text-white">{orgName}</span> based on the latest assessment snapshot.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/report/pdf"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              Export report
            </a>
            <Link
              href={hasAssessment ? "/questionnaire" : "/prequestionnaire"}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(8,145,178,0.2)] transition-all hover:bg-cyan-500"
            >
              <ShieldPlus className="h-4 w-4" />
              {hasAssessment ? "Retake Assessment" : "Start Assessment"}
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-12 items-stretch gap-6">
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-7">
            <section
              className="card-glass fade-up relative flex h-full min-h-[34rem] flex-col items-center justify-center overflow-hidden rounded-[2.5rem] p-8"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="hex-pattern pointer-events-none absolute top-0 left-0 h-full w-full opacity-10" />
              <div className="relative flex h-56 w-56 items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={getGaugeStroke(scorePercent)}
                    strokeWidth="8"
                    className="gauge-path"
                    style={{ ["--gauge-offset" as string]: gaugeOffset }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-7xl font-extrabold tracking-tighter text-white [font-family:var(--font-display)]">
                    {scorePercent}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300 [font-family:var(--font-mono)]">
                    Risk score
                  </span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <span className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${postureAccent}`}>
                  {postureLabel}
                </span>
              </div>
            </section>
          </div>

          <aside className="fade-up col-span-12 flex flex-col gap-6 lg:col-span-5" style={{ animationDelay: "0.2s" }}>
            <DashboardSecurityData metrics={metricCards} scorePercent={scorePercent} />
          </aside>
        </div>

        <section className="fade-up rounded-[2.5rem] border border-white/5 bg-[#0d1117] p-8" style={{ animationDelay: "0.3s" }}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold uppercase tracking-widest text-white [font-family:var(--font-mono)]">
                Alerts: High to Low
              </h2>
              <p className="mt-2 text-base text-slate-300">
                High-level triage only. Open the vulnerabilities page for full gap details or the action page for AI action guidance.
              </p>
            </div>
            <Link href="/knowledge-base" className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 transition-colors hover:text-cyan-200">
              Open Vulnerabilities
            </Link>
          </div>

          <div className="space-y-4">
            {vulnerabilities.length > 0 ? (
              vulnerabilities.map((item) => (
                <article key={item.questionId} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                          item.priority === "high"
                            ? "bg-rose-500/10 text-rose-300"
                            : item.priority === "medium"
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {item.frameworkReference}
                      </span>
                    </div>
                    <Link href="/report" className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300 transition-colors hover:text-cyan-200">
                      Fix this
                    </Link>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-base leading-7 text-slate-300">{item.description}</p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-sm text-slate-400">
                No active alerts yet. Run your first assessment to populate the command center.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
