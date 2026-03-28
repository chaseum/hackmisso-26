import Link from "next/link";
import { Lock, Shield, Zap } from "lucide-react";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { NeuralSecSignUpForm } from "@/components/neuralsec-sign-up-form";

const benefits = [
  {
    title: "Enterprise-Grade Privacy",
    description: "Your assessment data is encrypted at rest and in transit. We never sell organizational data.",
    icon: Lock,
    iconClassName: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
  },
  {
    title: "Instant Vulnerability Mapping",
    description: "Generate your first risk profile in under 15 minutes with our guided questionnaire.",
    icon: Zap,
    iconClassName: "border-pink-500/20 bg-pink-500/10 text-pink-400",
  },
] as const;

export default function SignUpPage() {
  return (
    <main className="homepage-grid relative flex min-h-screen flex-col overflow-x-hidden bg-[#010409] text-slate-300">
      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center opacity-10">
        <div className="h-[30rem] w-[30rem] rounded-full border border-cyan-500/10" />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="homepage-floating absolute top-1/4 left-10 flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-500/10">
          <Shield className="h-5 w-5 text-cyan-500/20" />
        </div>
        <div
          className="homepage-floating absolute right-10 bottom-1/4 flex h-16 w-16 items-center justify-center rounded-full border border-pink-500/10"
          style={{ animationDelay: "-2s" }}
        >
          <Lock className="h-7 w-7 text-pink-500/20" />
        </div>
      </div>

      <NeuralSecHeader
        activeItem="none"
        dashboardHref="/dashboard"
        resourcesHref="/knowledge-base"
        missionHref="/mission-control"
        ctaHref="/"
        ctaLabel="Log In"
      />

      <section className="relative z-20 flex flex-1 items-center justify-center px-6 py-20">
        <div className="grid w-full max-w-4xl items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold uppercase leading-tight tracking-tight text-white md:text-5xl [font-family:var(--font-display)]">
                Create your <span className="text-cyan-400">account</span>
              </h1>
              <p className="text-xl font-medium leading-relaxed text-slate-300">
                Create your login first. We&apos;ll capture organization name, type, and size in the next step before the assessment starts.
              </p>
            </div>

            <div className="space-y-6">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border ${benefit.iconClassName}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{benefit.title}</h3>
                      <p className="text-sm text-slate-500">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-[10px] uppercase tracking-widest text-slate-400 [font-family:var(--font-mono)]">
                  Secure Connection Established: TLS 1.3
                </span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-500/20 bg-[#0d1117]/80 p-10 shadow-[0_0_100px_rgba(6,182,212,0.1)] backdrop-blur-2xl">
            <div className="absolute top-0 left-0 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-1/3 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
            </div>

            <div className="mb-8 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 [font-family:var(--font-mono)]">
                Step 1: Account setup
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 [font-family:var(--font-mono)]">
                33% Complete
              </span>
            </div>

            <NeuralSecSignUpForm />

            <div className="mt-8 border-t border-white/5 pt-8 text-center">
              <p className="text-xs tracking-wider text-slate-600 [font-family:var(--font-mono)]">
                Already have an account?{" "}
                <Link href="/" className="font-bold uppercase text-white transition-colors hover:text-cyan-400">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="z-20 flex flex-col items-center justify-between gap-6 border-t border-white/5 px-8 py-10 text-[10px] uppercase tracking-widest text-slate-500 md:flex-row [font-family:var(--font-mono)]">
        <div className="flex items-center gap-4">
          <span>(c) 2024 SeKeyity Foundation</span>
          <span className="h-1 w-1 rounded-full bg-slate-700" />
          <span>Open-Source Protocol</span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/knowledge-base" className="transition-colors hover:text-white">Help center</Link>
          <Link href="/knowledge-base" className="transition-colors hover:text-white">Compliance</Link>
          <Link href="/mission-control" className="transition-colors hover:text-white">Support</Link>
        </div>
      </footer>
    </main>
  );
}
