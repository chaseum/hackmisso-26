"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRightCircle, Lock, ShieldCheck, Zap } from "lucide-react";
import type { OrgProfile } from "@/types/database";

const sizeOptions: Array<{ value: OrgProfile["size"]; label: string }> = [
  { value: "1-10", label: "1-10 people" },
  { value: "11-50", label: "11-50 people" },
  { value: "50+", label: "50+ people" },
];

export function PrequestionnaireForm({ initialName = "" }: { initialName?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orgProfile, setOrgProfile] = useState<OrgProfile>({
    name: initialName,
    type: "Nonprofit",
    size: "1-10",
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    params.set("orgName", orgProfile.name.trim());
    params.set("orgType", orgProfile.type);
    params.set("orgSize", orgProfile.size);
    router.push(`/questionnaire?${params.toString()}`);
  }

  return (
    <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold uppercase leading-tight tracking-tight text-white md:text-5xl [font-family:var(--font-display)]">
            Initialize organization <span className="text-cyan-400">protocol_</span>
          </h1>
          <p className="text-xl font-medium leading-relaxed text-slate-300">
            Set the context for your first security review so SeKeyity can tailor recommendations to your organization.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Enterprise-Grade Privacy</h3>
              <p className="text-sm text-slate-500">
                Your assessment data is encrypted at rest and in transit. We never sell organizational data.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-pink-500/20 bg-pink-500/10 text-pink-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Instant Vulnerability Mapping</h3>
              <p className="text-sm text-slate-500">
                We use your organization profile to make the risk output practical for your team size and operating model.
              </p>
            </div>
          </div>
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
          <div className="h-full w-2/3 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
        </div>

        <div className="mb-8 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 [font-family:var(--font-mono)]">
            Step 02: Pre-Questionnaire
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 [font-family:var(--font-mono)]">
            66% Complete
          </span>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Organization name</span>
            <input
              type="text"
              value={orgProfile.name}
              onChange={(event) => setOrgProfile((current) => ({ ...current, name: event.target.value }))}
              placeholder="Example Foundation"
              className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Organization type</span>
              <select
                value={orgProfile.type}
                onChange={(event) =>
                  setOrgProfile((current) => ({
                    ...current,
                    type: event.target.value as OrgProfile["type"],
                  }))
                }
                className="input-focus w-full appearance-none rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
              >
                <option value="Nonprofit">Nonprofit</option>
                <option value="Student Organization">Student Organization</option>
                <option value="Small Business">Small Business</option>
                <option value="Startup">Startup</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Organization size</span>
              <select
                value={orgProfile.size}
                onChange={(event) =>
                  setOrgProfile((current) => ({
                    ...current,
                    size: event.target.value as OrgProfile["size"],
                  }))
                }
                className="input-focus w-full appearance-none rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
              >
                {sizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              <ShieldCheck className="h-4 w-4" />
              Assessment Scope
            </div>
            <p className="text-sm text-slate-400">
              We&apos;ll use this profile to tune the recommendation language, control urgency, and expected implementation effort.
            </p>
          </div>

          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-600 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(8,145,178,0.2)] transition-all hover:bg-cyan-500"
          >
            <ArrowRightCircle className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            Initialize Assessment
          </button>
        </form>

        <div className="mt-8 border-t border-white/5 pt-8 text-center">
          <p className="text-xs tracking-wider text-slate-600 [font-family:var(--font-mono)]">
            Need to adjust account details?{" "}
            <Link href="/dashboard" className="font-bold uppercase text-white transition-colors hover:text-cyan-400">
              Open Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
