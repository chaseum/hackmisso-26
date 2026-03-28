"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Sparkles, Trophy } from "lucide-react";
import { makeRiskHref } from "@/lib/risk-links";

type AlertItem = {
  level: "high risk" | "medium risk" | "low risk";
  levelClassName: string;
  title: string;
  description: string;
  frameworkReference?: string;
};

type CelebrationState = {
  id: number;
  alertTitle: string;
};

type PendingMitigationState = {
  id: number;
  alertTitle: string;
};

function getMitigationBoost(level: AlertItem["level"]) {
  if (level === "high risk") return 6;
  if (level === "medium risk") return 4;
  return 2;
}

function isEasyMitigation(alert: AlertItem) {
  const combinedText = [alert.title, alert.description, alert.frameworkReference].join(" ").toLowerCase();
  return /(mfa|multi-factor|password|backup|training|antivirus|malware|device inventory|account access)/.test(combinedText);
}

export function AlertsMitigationBoard({
  alerts,
  baseSecurityScore,
}: {
  alerts: AlertItem[];
  baseSecurityScore: number;
}) {
  const [mitigatedTitles, setMitigatedTitles] = useState<string[]>([]);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [pendingMitigation, setPendingMitigation] = useState<PendingMitigationState | null>(null);

  const scoreLift = useMemo(
    () =>
      alerts.reduce((sum, alert) => {
        if (!mitigatedTitles.includes(alert.title)) {
          return sum;
        }

        return sum + getMitigationBoost(alert.level);
      }, 0),
    [alerts, mitigatedTitles],
  );
  const liveSecurityScore = Math.min(100, baseSecurityScore + scoreLift);
  const quickWinCount = alerts.filter(isEasyMitigation).length;

  function finalizeMitigation(alert: AlertItem) {
    setMitigatedTitles((current) => {
      return [...current, alert.title];
    });

    const id = Date.now();
    setCelebration({ id, alertTitle: alert.title });
    window.setTimeout(() => {
      setCelebration((current) => (current?.id === id ? null : current));
    }, 1400);
  }

  function handleMitigationToggle(alert: AlertItem) {
    const isMitigated = mitigatedTitles.includes(alert.title);

    if (isMitigated) {
      setMitigatedTitles((current) => current.filter((title) => title !== alert.title));
      return;
    }

    const pendingId = Date.now();
    setPendingMitigation({ id: pendingId, alertTitle: alert.title });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    window.setTimeout(() => {
      setPendingMitigation((current) => {
        if (current?.id !== pendingId) {
          return current;
        }

        finalizeMitigation(alert);
        return null;
      });
    }, 700);
  }

  return (
    <div className="space-y-6">
      <section className="card-glass relative overflow-hidden rounded-[1.75rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-200">
              <Sparkles className="h-4 w-4" />
              Instant Remediation
            </div>
            <h2 className="mt-3 text-3xl font-bold text-white [font-family:var(--font-display)]">
              Security Score
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              Mark quick wins as mitigated to simulate the near-term impact of simple fixes.
            </p>
          </div>

          <motion.div
            key={liveSecurityScore}
            initial={{ scale: 0.92, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-400/10 px-6 py-4 text-right"
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100">Live score</p>
            <div className="mt-2 flex items-end justify-end gap-2">
              <span className="text-5xl font-black text-white [font-family:var(--font-display)]">{liveSecurityScore}</span>
              <span className="pb-1 text-sm font-bold text-emerald-100">/100</span>
            </div>
            <p className="mt-1 text-xs text-emerald-100/80">+{scoreLift} from mitigated quick wins</p>
          </motion.div>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/6">
          <motion.div
            className="h-full bg-[linear-gradient(90deg,#34d399,#22d3ee)] shadow-[0_0_16px_rgba(52,211,153,0.4)]"
            initial={{ width: `${baseSecurityScore}%` }}
            animate={{ width: `${liveSecurityScore}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
            {quickWinCount} quick wins available
          </span>
          <span className="text-sm text-slate-300">
            Tap the large green button on a card to immediately mark an easy fix as mitigated.
          </span>
        </div>

        {pendingMitigation ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50"
          >
            Applying mitigation for <span className="font-semibold">{pendingMitigation.alertTitle}</span> and updating the live score...
          </motion.div>
        ) : null}

        <AnimatePresence>
          {celebration ? (
            <motion.div
              key={celebration.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0"
            >
              <motion.div
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: -8, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute top-8 right-8 flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-50"
              >
                <Trophy className="h-4 w-4" />
                Score increased
              </motion.div>

              {[
                "top-10 right-28",
                "top-18 right-18",
                "top-24 right-36",
                "top-14 right-50",
                "top-22 right-62",
                "top-8 right-14",
              ].map((position, index) => (
                <motion.span
                  key={`${celebration.id}-${position}`}
                  initial={{ opacity: 0, y: 8, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 0], y: -24 - index * 3, scale: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.04, ease: "easeOut" }}
                  className={`absolute ${position} h-2.5 w-2.5 rounded-full ${
                    index % 2 === 0 ? "bg-emerald-300" : "bg-cyan-300"
                  }`}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <section className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const easyMitigation = isEasyMitigation(alert);
            const isMitigated = mitigatedTitles.includes(alert.title);
            const isPending = pendingMitigation?.alertTitle === alert.title;

            return (
              <motion.article
                key={`${alert.level}-${alert.title}`}
                layout
                className={`card-glass rounded-[1.5rem] p-5 transition-colors ${
                  isMitigated ? "border-emerald-300/20 bg-emerald-400/[0.06]" : ""
                }`}
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
                  <Link
                    href={makeRiskHref({ frameworkReference: alert.frameworkReference, title: alert.title })}
                    className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 transition-colors hover:text-cyan-200"
                  >
                    Open detail
                  </Link>
                </div>

                <h3 className="text-base font-semibold text-white">{alert.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{alert.description}</p>

                {easyMitigation ? (
                  <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.05] p-4">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                      <Sparkles className="h-4 w-4" />
                      Quick Win
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">This is an easy mitigation action</p>
                        <p className="mt-1 text-xs text-slate-300">
                          Marking it complete applies a {getMitigationBoost(alert.level)} point security score lift.
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-pressed={isMitigated}
                        disabled={isPending}
                        onClick={() => handleMitigationToggle(alert)}
                        className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors ${
                          isMitigated
                            ? "border border-emerald-300/25 bg-emerald-400/15 text-emerald-50"
                            : "bg-emerald-500 text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.24)] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isMitigated ? "Mitigated" : isPending ? "Updating Score..." : "Mark as Mitigated"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-white/8 bg-white/[0.02] px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                    Requires a larger remediation project
                  </div>
                )}
              </motion.article>
            );
          })
        ) : (
          <div className="card-glass rounded-[1.5rem] p-5 text-sm text-slate-400">
            No alerts are available yet. Run a scan first.
          </div>
        )}
      </section>
    </div>
  );
}
