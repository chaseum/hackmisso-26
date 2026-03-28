import Link from "next/link";
import { Download, ShieldPlus } from "lucide-react";
import { DashboardSecurityData } from "@/components/dashboard-security-data";
import { TiltCard } from "@/components/motion-ui";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { ReportActionAssistantModal } from "@/components/report-action-assistant-modal";
import { SetupNotice } from "@/components/site";
import { TypewriterHeading } from "@/components/typewriter-heading";
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

function getGaugeOffset(securityScore: number) {
  const circumference = 283;
  return Number((circumference * (1 - securityScore / 100)).toFixed(2));
}

function getPostureAccent(securityScore: number) {
  if (securityScore >= 80) return "border-cyan-500/20 bg-cyan-500/10 text-cyan-400";
  if (securityScore >= 60) return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
  return "border-rose-500/20 bg-rose-500/10 text-rose-300";
}

function getGaugeStroke(securityScore: number) {
  if (securityScore >= 80) return "#22d3ee";
  if (securityScore >= 60) return "#fbbf24";
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
  const userDisplayName =
    typeof user?.user_metadata.full_name === "string" && user.user_metadata.full_name.trim().length > 0
      ? user.user_metadata.full_name.trim().split(" ")[0]
      : typeof user?.email === "string" && user.email.includes("@")
        ? user.email.split("@")[0]
        : "there";
  const assessment = report?.assessment ?? null;
  const vulnerabilities = report?.vulnerabilities ?? [];
  const securityScore = report?.securityScore ?? 0;
  const riskScorePercent = report?.riskScorePercent ?? 0;
  const postureLabel = report?.postureLabel ?? "Needs attention";
  const postureAccent = getPostureAccent(securityScore);
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
  const gaugeOffset = getGaugeOffset(securityScore);
  const chatPayload = {
    securityScore: report?.securityScore ?? 0,
    riskScorePercent: report?.riskScorePercent ?? 0,
    postureLabel: report?.postureLabel ?? "Needs attention",
    recommendations: report?.recommendations ?? [],
    vulnerabilities: report?.vulnerabilities ?? [],
  };

  return (
    <div className="grid-bg paper-grid-bg relative flex min-h-screen flex-col bg-[#010409] text-slate-300">
      <NeuralSecHeader
        activeItem="dashboard"
        dashboardHref="/dashboard"
        resourcesHref="/knowledge-base"
        missionHref="/report"
        ctaHref={hasAssessment ? "/questionnaire" : "/prequestionnaire"}
        ctaLabel={hasAssessment ? "Restart Assessment" : "Start Assessment"}
        showLogout={Boolean(user)}
      />

      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-8 py-14">
        <section className="fade-up flex flex-col items-start justify-between gap-8 border-b border-white/5 pb-12 md:flex-row md:items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.32em] text-cyan-400 [font-family:var(--font-mono)]">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Command Center
            </div>
            <TypewriterHeading
              text={`Hey ${userDisplayName}, how's security today?`}
              speed={64}
              className="text-6xl font-bold tracking-tight text-white [font-family:var(--font-display)] md:text-7xl xl:text-[5.75rem]"
            />
            <p className="max-w-4xl text-xl leading-9 text-slate-300 md:text-2xl">
              Fast triage for <span className="font-medium text-white">{orgName}</span> based on the latest assessment snapshot.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/api/report/pdf"
              className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-base font-bold text-white transition-all hover:bg-white/10"
            >
              <Download className="h-5 w-5" />
              Export report
            </a>
            <Link
              href={hasAssessment ? "/questionnaire" : "/prequestionnaire"}
              className="tactile-button flex items-center gap-2 whitespace-nowrap rounded-xl bg-cyan-600 px-7 py-3.5 text-base font-bold text-white shadow-[0_0_20px_rgba(8,145,178,0.2)] hover:bg-cyan-500"
            >
              <ShieldPlus className="h-5 w-5" />
              {hasAssessment ? "Retake Assessment" : "Start Assessment"}
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-12 items-stretch gap-6">
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-7">
            <TiltCard className="card-glass fade-up relative h-full min-h-[42rem] overflow-hidden rounded-[2.5rem] p-12">
              <div className="relative flex h-full min-h-[34rem] w-full flex-col items-center justify-center text-center">
                <div className="hex-pattern pointer-events-none absolute top-0 left-0 h-full w-full opacity-10" />
                <div className="relative flex h-72 w-72 items-center justify-center">
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
                    stroke={getGaugeStroke(securityScore)}
                    strokeWidth="8"
                    className="gauge-path"
                    style={{ ["--gauge-offset" as string]: gaugeOffset }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-8xl font-extrabold tracking-tighter text-white [font-family:var(--font-display)]">
                    {securityScore}
                  </span>
                  <span className="mt-1 text-sm font-bold uppercase tracking-widest text-slate-300 [font-family:var(--font-mono)]">
                    Security score
                  </span>
                </div>
              </div>
                <div className="mt-8 text-center">
                  <span className={`rounded-full border px-5 py-2 text-sm font-bold uppercase tracking-widest ${postureAccent}`}>
                    {postureLabel}
                  </span>
                  <p className="mt-4 text-sm text-slate-400">Current risk exposure: {riskScorePercent}/100</p>
                </div>
              </div>
            </TiltCard>
          </div>

          <aside className="fade-up col-span-12 flex flex-col gap-6 lg:col-span-5" style={{ animationDelay: "0.2s" }}>
            <DashboardSecurityData metrics={metricCards} scorePercent={securityScore} vulnerabilities={vulnerabilities} />
          </aside>
        </div>

        <section className="fade-up rounded-[2.5rem] border border-white/5 bg-[#0d1117] p-10" style={{ animationDelay: "0.3s" }}>
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-widest text-white [font-family:var(--font-mono)]">
                Alerts: High to Low
              </h2>
              <p className="mt-3 text-lg leading-8 text-slate-300">
                High-level triage only. Open the vulnerabilities page for full gap details or the action page for AI action guidance.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
              <Link
                href="/alerts"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/10 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-emerald-100 transition-colors hover:bg-emerald-400/15"
              >
                Open Instant Remediation
              </Link>
              <Link
                href="/knowledge-base"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-400/15"
              >
                Open Vulnerabilities
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            {vulnerabilities.length > 0 ? (
              vulnerabilities.map((item) => (
                <article key={item.questionId} className="rounded-2xl border border-white/5 bg-white/[0.03] p-7">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${
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
                    <Link href="/report" className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 transition-colors hover:text-cyan-200">
                      Fix this
                    </Link>
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-lg leading-8 text-slate-300">{item.description}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300/10 bg-emerald-400/[0.04] px-4 py-3">
                    <p className="text-sm text-slate-200">
                      Want the quick UX? Use the alerts page to mark easy fixes as mitigated and watch the score increase live.
                    </p>
                    <Link
                      href="/alerts"
                      className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-emerald-400"
                    >
                      Mark as Mitigated
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-7 text-base text-slate-400">
                No active alerts yet. Run your first assessment to populate the command center.
              </div>
            )}
          </div>
        </section>
      </main>
      {hasAssessment ? <ReportActionAssistantModal assessmentResults={chatPayload} mode="floating" /> : null}
    </div>
  );
}
