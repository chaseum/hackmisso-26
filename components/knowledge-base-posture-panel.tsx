"use client";

import { motion } from "motion/react";
import { Clock3, Lock, RefreshCw, Shield } from "lucide-react";
import Link from "next/link";

type RiskSegment = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

function getGaugeOffset(scorePercent: number) {
  const circumference = 302;
  return Number((circumference * (1 - scorePercent / 100)).toFixed(2));
}

function getRiskTone(scorePercent: number) {
  if (scorePercent >= 80) {
    return {
      bar: "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]",
      text: "text-cyan-300",
    };
  }

  if (scorePercent >= 60) {
    return {
      bar: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]",
      text: "text-amber-300",
    };
  }

  return {
    bar: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]",
    text: "text-rose-300",
  };
}

export function KnowledgeBasePosturePanel({
  scorePercent,
  postureLabel,
  postureTone,
  postureRingClassName,
  headline,
  subcopy,
  scanStatus,
  hasAssessment,
  riskSegments,
}: {
  scorePercent: number;
  postureLabel: string;
  postureTone: string;
  postureRingClassName: string;
  headline: string;
  subcopy: string;
  scanStatus: string;
  hasAssessment: boolean;
  riskSegments: RiskSegment[];
}) {
  const gaugeOffset = getGaugeOffset(scorePercent);
  const riskTone = getRiskTone(scorePercent);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#0d1117] p-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-44 w-44 items-center justify-center">
            <svg viewBox="0 0 120 120" className="-rotate-90 h-full w-full">
              <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                className={`gauge-path ${postureRingClassName}`}
                style={{ ["--gauge-offset" as string]: gaugeOffset }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold tracking-tighter text-white [font-family:var(--font-display)]">
                {scorePercent}
              </span>
              <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Security Score</span>
            </div>
          </div>

          <div className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] ${postureTone}`}>
            <Shield className="h-3.5 w-3.5" />
            {postureLabel}
          </div>

          <div className="mt-5 w-full max-w-[13rem]">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
              <span>Current security score</span>
              <span className={riskTone.text}>{scorePercent}/100</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className={`h-full ${riskTone.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${scorePercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                Current Security Posture
              </span>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${hasAssessment ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-amber-500/20 bg-amber-500/10 text-amber-300"}`}>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" />
                  {scanStatus}
                </span>
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white [font-family:var(--font-display)]">
              {headline}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-400">{subcopy}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {riskSegments.map((segment, index) => (
              <article key={segment.label} className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{segment.label}</span>
                  <span className="text-lg font-bold text-white">{segment.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className={`h-full ${segment.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(12, Math.min(100, segment.percent))}%` }}
                    transition={{ duration: 0.65, ease: "easeOut", delay: 0.08 * index }}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={hasAssessment ? "/questionnaire" : "/prequestionnaire"}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-cyan-500"
            >
              <RefreshCw className="h-4 w-4" />
              {hasAssessment ? "Run New Scan" : "Start Scan"}
            </Link>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
            >
              <Lock className="h-4 w-4" />
              View Fix Plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
