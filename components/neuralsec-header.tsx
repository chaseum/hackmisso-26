import Link from "next/link";
import { KeyRound, LockKeyhole, Settings } from "lucide-react";
import { signOutAction } from "@/lib/actions";

type ActiveItem = "dashboard" | "resources" | "mission" | "settings" | "none";

export function NeuralSecHeader({
  activeItem = "dashboard",
  homeHref = "/",
  dashboardHref = "/dashboard",
  resourcesHref = "/knowledge-base",
  missionHref = "/mission-control",
  ctaHref = "/dashboard",
  ctaLabel = "Start Assessment",
  showLogout = false,
  showPrimaryNav = true,
  settingsHref = "/settings",
  onCtaClick,
}: {
  activeItem?: ActiveItem;
  homeHref?: string;
  dashboardHref?: string;
  resourcesHref?: string;
  missionHref?: string;
  ctaHref?: string;
  ctaLabel?: string;
  showLogout?: boolean;
  showPrimaryNav?: boolean;
  settingsHref?: string;
  onCtaClick?: () => void;
}) {
  const resolvedHomeHref = showLogout && homeHref === "/" ? dashboardHref : homeHref;

  return (
    <header className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-white/5 bg-[#010409]/60 px-8 py-6 backdrop-blur-xl">
      <Link href={resolvedHomeHref} className="flex items-center gap-3 justify-self-start transition-opacity hover:opacity-90">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/[0.03] shadow-[0_0_15px_rgba(6,182,212,0.14)]">
          <LockKeyhole className="h-5 w-5 text-white" />
          <KeyRound className="absolute -right-1 -bottom-1 h-3.5 w-3.5 text-cyan-400" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white font-['Cabinet_Grotesk']">
          Se<span className="text-cyan-400">Key</span>ity
        </span>
      </Link>

      <nav className={`items-center gap-10 justify-self-center ${showPrimaryNav ? "hidden md:flex" : "hidden"}`}>
        <Link
          href={dashboardHref}
          className={`text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
            activeItem === "dashboard" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Dashboard
        </Link>
        <Link
          href={resourcesHref}
          className={`text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
            activeItem === "resources" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Vulnerabilities
        </Link>
        <Link
          href={missionHref}
          className={`text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
            activeItem === "mission" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Recommendations
        </Link>
      </nav>

      <div className="flex items-center gap-3 justify-self-end">
        {showLogout ? (
          <Link
            href={settingsHref}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full border text-white transition-all ${
              activeItem === "settings"
                ? "border-cyan-400/35 bg-cyan-500/12"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
            aria-label="Account settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        ) : null}
        <Link
          href={ctaHref}
          onClick={onCtaClick}
          className="tactile-button rounded-full bg-cyan-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:bg-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
        >
          {ctaLabel}
        </Link>
        {showLogout ? (
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
            >
              Logout
            </button>
          </form>
        ) : null}
      </div>
    </header>
  );
}
