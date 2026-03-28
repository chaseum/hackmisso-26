"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  ArrowLeftCircle,
  Box,
  Cpu,
  ShieldAlert,
  Terminal,
  Unlock,
} from "lucide-react";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { authenticateWithPassword } from "@/lib/actions";

type HeroState = "idle" | "locked" | "auth";
const initialAuthState = { error: "", success: "" };

export default function HomePage() {
  const [heroState, setHeroState] = useState<HeroState>("idle");
  const engageTimerRef = useRef<number | null>(null);
  const authTimerRef = useRef<number | null>(null);
  const signInAction = authenticateWithPassword.bind(null, "sign-in");
  const [authState, formAction, pending] = useActionState(signInAction, initialAuthState);

  useEffect(() => {
    return () => {
      if (engageTimerRef.current) {
        window.clearTimeout(engageTimerRef.current);
      }
      if (authTimerRef.current) {
        window.clearTimeout(authTimerRef.current);
      }
    };
  }, []);

  function engageSecurity() {
    if (heroState !== "idle") return;

    setHeroState("locked");

    engageTimerRef.current = window.setTimeout(() => {
      authTimerRef.current = window.setTimeout(() => {
        setHeroState("auth");
      }, 650);
    }, 520);
  }

  function resetView() {
    if (engageTimerRef.current) {
      window.clearTimeout(engageTimerRef.current);
    }
    if (authTimerRef.current) {
      window.clearTimeout(authTimerRef.current);
    }
    setHeroState("idle");
  }

  const isZoomed = heroState === "locked" || heroState === "auth";

  return (
    <main className="homepage-grid relative min-h-screen overflow-hidden bg-[#010409] text-slate-300">
      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center opacity-20">
        <div className="flex h-[30rem] w-[30rem] items-center justify-center rounded-full border border-cyan-500/10 bg-cyan-500/[0.03] shadow-[0_0_120px_rgba(6,182,212,0.08)]">
          <div className="h-[20rem] w-[20rem] rotate-[30deg] rounded-[4rem] border border-cyan-500/15" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="homepage-floating absolute top-1/4 left-1/4 flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-500/20">
          <Box className="h-5 w-5 text-cyan-500/30" />
        </div>
        <div
          className="homepage-floating absolute right-1/4 bottom-1/4 flex h-16 w-16 items-center justify-center rounded-full border border-pink-500/20"
          style={{ animationDelay: "-2s" }}
        >
          <Cpu className="h-7 w-7 text-pink-500/30" />
        </div>
        <div
          className="homepage-floating absolute top-1/3 right-10 h-8 w-8 rotate-45 border border-white/10"
          style={{ animationDelay: "-4s" }}
        />
      </div>

      <NeuralSecHeader
        activeItem="none"
        dashboardHref="/dashboard"
        resourcesHref="/knowledge-base"
        missionHref="/mission-control"
        ctaHref="/sign-up"
        ctaLabel="Sign Up"
        showPrimaryNav={false}
      />

      <section className="relative z-20 flex min-h-[calc(100vh-89px)] flex-col">
        <div
          className={`homepage-zoom flex flex-1 flex-col items-center justify-center px-4 ${isZoomed ? "homepage-zoomed" : ""}`}
        >
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h1
              className="homepage-glitch mb-6 text-5xl font-extrabold uppercase tracking-[0.15em] text-white [font-family:var(--font-display)] md:text-7xl"
              data-text="ENHANCE YOUR SECURITY"
            >
              Think outside the Lock.
            </h1>
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-400/60 [font-family:var(--font-mono)]">
              Enhance your organization&apos;s future digital security
            </p>
          </div>

          <button
            type="button"
            onClick={engageSecurity}
            className={`homepage-lock group flex h-96 w-80 cursor-pointer flex-col items-center justify-center ${heroState !== "idle" ? "is-locked" : ""}`}
            aria-label="Open secure access portal"
          >
            <svg viewBox="0 0 200 240" className="homepage-neon h-full w-full transition-all duration-700">
              <path
                d="M50,110 V70 C50,30 72,15 100,15 C128,15 150,40 150,70 V110"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="12"
                strokeLinecap="round"
                className="lock-shackle"
              />
              <rect x="20" y="100" width="160" height="130" rx="20" fill="#010409" stroke="#06b6d4" strokeWidth="4" />
              <circle cx="45" cy="125" r="5" fill="#f43f5e">
                <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="155" cy="125" r="5" fill="#eab308" />
              <g>
                <circle
                  cx="100"
                  cy="165"
                  r="42"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  opacity="0.4"
                  strokeDasharray="10,10"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 100 165"
                    to="360 100 165"
                    dur="10s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="100" cy="165" r="32" fill="none" stroke="#f43f5e" strokeWidth="2" />
                <circle cx="100" cy="165" r="10" fill="#f43f5e" />
                <line x1="100" y1="165" x2="100" y2="195" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
              </g>
            </svg>

            <div className="mt-12 transition-transform group-hover:scale-110">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-6 py-2 backdrop-blur-md">
                  <Unlock className="h-4 w-4 animate-pulse text-cyan-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white [font-family:var(--font-mono)]">
                    Open secure login
                  </span>
                </div>
                <div className="h-4 w-px bg-cyan-500/30" />
              </div>
            </div>
          </button>
        </div>

        <section className="relative z-20 border-t border-white/5 bg-[#02070d]/80 px-6 py-14 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] border border-cyan-400/20 bg-white/[0.03] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-cyan-300">Resources</p>
              <h2 className="mt-4 text-3xl font-extrabold text-white [font-family:var(--font-display)]">Security guides and resources</h2>
              <p className="mt-3 text-base leading-8 text-slate-200">
                Browse practical security guidance, issue summaries, and support materials for your organization.
              </p>
            </div>
            <div className="rounded-[2rem] border border-pink-400/20 bg-white/[0.03] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-pink-300">Onboarding</p>
              <h2 className="mt-4 text-3xl font-extrabold text-white [font-family:var(--font-display)]">Set up your organization</h2>
              <p className="mt-3 text-base leading-8 text-slate-200">
                Create an account and start your first assessment with a guided sign-up flow.
              </p>
            </div>
            <div className="rounded-[2rem] border border-amber-300/20 bg-white/[0.03] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-amber-200">Action Plan</p>
              <h2 className="mt-4 text-3xl font-extrabold text-white [font-family:var(--font-display)]">Recommended next steps</h2>
              <p className="mt-3 text-base leading-8 text-slate-200">
                Review recommended security actions, deadlines, and urgent follow-up tasks.
              </p>
            </div>
          </div>
        </section>
      </section>

      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#010409] p-6 opacity-0 transition-all duration-[850ms] ${
          heroState === "auth" ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-[0.85]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="absolute h-[100vw] max-h-[1200px] w-[100vw] max-w-[1200px] animate-pulse rounded-full bg-cyan-500/5 blur-[120px]" />
          <div className="relative flex h-[600px] w-[600px] items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[100px] border-cyan-500/10 blur-[60px]" />
            <div className="absolute inset-0 scale-110 rounded-full border-[2px] border-cyan-400/40 blur-sm" />
            <div className="h-32 w-32 rounded-full bg-cyan-400/10 blur-[40px]" />
            <div className="absolute h-40 w-12 translate-y-12 bg-cyan-400/10 blur-[40px]" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#010409_75%)]" />
        </div>

        <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-cyan-500/30 bg-[#0d1117]/90 p-10 shadow-[0_0_80px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
          <div className="absolute -top-20 -left-20 h-40 w-40 bg-cyan-500/10 blur-[80px]" />
          <div className="absolute -right-20 -bottom-20 h-40 w-40 bg-pink-500/10 blur-[80px]" />

          <div className="relative z-10">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <ShieldAlert className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white [font-family:var(--font-display)]">Login</h2>
              <p className="mt-2 text-sm uppercase tracking-wide text-slate-400/70 [font-family:var(--font-mono)]">
                Sign in to access your organization dashboard
              </p>
            </div>

            <form action={formAction} className="space-y-5">
              <label className="block space-y-2">
                <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">Email address</span>
                <input
                  type="email"
                  name="email"
                  placeholder="admin@organization.org"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-4 text-sm text-white placeholder:text-slate-700 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">Password</span>
                <input
                  type="password"
                  name="password"
                  placeholder="************"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-4 text-sm text-white placeholder:text-slate-700 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
                  minLength={8}
                  required
                />
              </label>

              {authState.error ? <p className="text-sm text-rose-400">{authState.error}</p> : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-cyan-600 py-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_25px_rgba(8,145,178,0.2)] transition-all hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Terminal className="h-4 w-4" />
                  <span className={pending ? "text-[10px] tracking-[0.16em]" : undefined}>
                    {pending ? "Authenticating" : "Login"}
                  </span>
                </button>
                <Link
                  href="/sign-up"
                  className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10"
                >
                  Sign Up
                </Link>
              </div>
            </form>

            <div className="mt-10 border-t border-white/5 pt-10 text-center">
              <p className="text-xs tracking-wider text-slate-500 [font-family:var(--font-mono)]">
                Need full system visibility?{" "}
                <Link href="/dashboard" className="font-bold uppercase text-cyan-400 transition-colors hover:text-cyan-300">
                  Open Dashboard
                </Link>
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={resetView}
          className={`absolute top-10 right-10 z-[110] transition-colors ${
            heroState === "auth"
              ? "pointer-events-auto opacity-100 text-slate-500 hover:text-white"
              : "pointer-events-none opacity-0"
          }`}
          aria-label="Return to homepage"
        >
          <ArrowLeftCircle className="h-9 w-9" />
        </button>
      </div>
    </main>
  );
}
