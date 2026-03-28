import Link from "next/link";
import {
  Calendar,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { createServerClientSafe } from "@/lib/supabase";

const stats = [
  { label: "Recommended actions", value: "12", icon: Layers, wrapperClass: "border-white/5", labelClass: "text-slate-500", iconClass: "text-slate-700" },
] as const;

const missions = [
  { id: "MS-702", priority: "High priority", priorityClass: "border-red-500/30 bg-red-500/10 text-red-500", dotClass: "bg-red-500", progress: "65%", progressClass: "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]", progressTextClass: "text-cyan-400", days: "2 days left", title: "Multi-factor authentication rollout", description: "Require stronger sign-in protection for student leaders and administrators to reduce account takeover risk.", cta: "Continue task", ctaClass: "border border-white/10 bg-white/5 text-white hover:border-cyan-500/50 hover:bg-cyan-500/10", icon: Calendar, iconClass: "text-slate-500", complete: false },
  { id: "MS-419", priority: "Medium priority", priorityClass: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500", dotClass: "bg-yellow-500", progress: "30%", progressClass: "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]", progressTextClass: "text-cyan-400", days: "8 days left", title: "Review old account access", description: "Check and remove old domain or app access that may still belong to former officers or volunteers.", cta: "Start task", ctaClass: "border border-white/10 bg-white/5 text-white hover:border-cyan-500/50 hover:bg-cyan-500/10", icon: Calendar, iconClass: "text-slate-500", complete: false },
  { id: "MS-241", priority: "Low priority", priorityClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-500", dotClass: "bg-cyan-500", progress: "15%", progressClass: "bg-cyan-500", progressTextClass: "text-cyan-400", days: "14 days left", title: "Update website firewall rules", description: "Improve web protection rules to block suspicious traffic and common attack attempts.", cta: "Start task", ctaClass: "border border-white/10 bg-white/5 text-white hover:border-cyan-500/50 hover:bg-cyan-500/10", icon: Calendar, iconClass: "text-slate-500", complete: false },
] as const;

export default async function MissionControlPage() {
  const supabase = await createServerClientSafe();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <div className="homepage-grid relative flex min-h-screen flex-col bg-[#010409] text-slate-300">
      <NeuralSecHeader
        activeItem="mission"
        dashboardHref="/dashboard"
        resourcesHref="/knowledge-base"
        missionHref="/mission-control"
        ctaHref="/prequestionnaire"
        ctaLabel="Retake Assessment"
        showLogout={Boolean(user)}
      />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-12 px-8 py-12">
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.4em] text-cyan-500 [font-family:var(--font-mono)]">
            <span>Plan status: Active</span>
            <div className="h-px flex-1 bg-cyan-950/50" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl [font-family:var(--font-display)]">
            Security Action Plan
          </h1>
          <p className="max-w-2xl text-slate-400">
            Review, assign, and complete security tasks for your organization. Each item is a practical step toward stronger protection.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-1">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article key={stat.label} className={`mission-stat glow-border rounded-2xl border p-6 ${stat.wrapperClass}`}>
                <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest [font-family:var(--font-mono)] ${stat.labelClass}`}>
                  {stat.label}
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-white [font-family:var(--font-mono)]">{stat.value}</span>
                  <Icon className={`h-6 w-6 ${stat.iconClass}`} />
                </div>
              </article>
            );
          })}
        </section>

        <div className="flex flex-col items-start gap-10">
          <div className="flex w-full flex-1 flex-col gap-8">
            <div className="flex flex-col justify-between gap-6 border-b border-white/5 pb-6 md:flex-row md:items-center">
              <div className="text-xs uppercase tracking-widest text-slate-500 [font-family:var(--font-mono)]">
                Sorted by: Priority
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {missions.map((mission) => {
                const StatusIcon = mission.icon;

                return (
                  <article
                    key={mission.id}
                    className="mission-card flex h-full flex-col rounded-3xl border border-white/10 p-8"
                  >
                    <div className="mb-6 flex items-start justify-between">
                      <div className={`flex items-center gap-2 rounded-full border px-3 py-1 ${mission.priorityClass}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${mission.dotClass}`} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{mission.priority}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 [font-family:var(--font-mono)]">ID: {mission.id}</span>
                    </div>

                    <h3 className="mb-3 text-xl font-bold tracking-tight text-white">{mission.title}</h3>
                    <p className="mb-8 text-sm leading-relaxed text-slate-400">{mission.description}</p>

                    <div className="mt-auto space-y-6">
                      <div>
                        <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-slate-500">Progress</span>
                          <span className={mission.progressTextClass}>{mission.progress}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
                          <div className={`progress-bar-fill h-full ${mission.progressClass}`} style={{ width: mission.progress }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <StatusIcon className={`h-4 w-4 ${mission.iconClass}`} />
                          <span>{mission.days}</span>
                        </div>
                        <Link href="/dashboard" className={`rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${mission.ctaClass}`}>
                          {mission.cta}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      <footer className="mt-12 flex flex-col items-center justify-between gap-8 border-t border-white/5 bg-[#0d1117]/50 p-8 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-sm font-bold text-white [font-family:var(--font-display)]">
            NEURAL<span className="text-cyan-400">SEC_</span>
          </span>
        </div>
        <div className="flex gap-8 text-[10px] uppercase tracking-widest text-slate-500 [font-family:var(--font-mono)]">
          <Link href="/knowledge-base" className="transition-colors hover:text-white">Privacy policy</Link>
          <Link href="/knowledge-base" className="transition-colors hover:text-white">Terms of service</Link>
          <Link href="/sign-up" className="transition-colors hover:text-white">Contact support</Link>
        </div>
        <div className="text-[10px] tracking-widest text-slate-600 [font-family:var(--font-mono)]">
          (c) 2024 SeKeyity. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
