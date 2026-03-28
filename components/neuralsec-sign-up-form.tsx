"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { authenticateWithPassword } from "@/lib/actions";

const initialState = { error: "", success: "" };

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { label: "Weak", activeBars: 1, barClassName: "bg-rose-400", textClassName: "text-rose-300" };
  }

  if (score <= 3) {
    return { label: "Moderate", activeBars: 2, barClassName: "bg-amber-400", textClassName: "text-amber-300" };
  }

  if (score === 4) {
    return { label: "Strong", activeBars: 3, barClassName: "bg-cyan-400", textClassName: "text-cyan-300" };
  }

  return { label: "Very Strong", activeBars: 4, barClassName: "bg-emerald-400", textClassName: "text-emerald-300" };
}

export function NeuralSecSignUpForm() {
  const action = authenticateWithPassword.bind(null, "sign-up");
  const [state, formAction, pending] = useActionState(action, initialState);
  const [password, setPassword] = useState("");
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Organization name</span>
          <input
            type="text"
            name="team_name"
            placeholder="Example Foundation"
            className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Organization type</span>
          <select className="input-focus w-full appearance-none rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white focus:ring-1 focus:ring-cyan-500/50 focus:outline-none">
            <option>Nonprofit (501c3)</option>
            <option>Student Organization</option>
            <option>Community Group</option>
            <option>Other</option>
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Full name</span>
        <input
          type="text"
          name="full_name"
          placeholder="Avery Chen"
          className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
          required
        />
      </label>

      <label className="space-y-2">
        <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Email address</span>
        <input
          type="email"
          name="email"
          placeholder="admin@protocol.org"
          autoComplete="email"
          className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
          required
        />
      </label>

      <label className="space-y-2">
        <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Password</span>
        <input
          type="password"
          name="password"
          placeholder="************"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
          required
        />
        <div className="mt-2 flex gap-1 px-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${index < passwordStrength.activeBars ? passwordStrength.barClassName : "bg-white/5"}`}
            />
          ))}
          <span className={`ml-2 text-[9px] font-bold uppercase tracking-widest ${passwordStrength.textClassName}`}>
            {passwordStrength.label}
          </span>
        </div>
      </label>

      <div className="flex items-start gap-3 px-2 pt-2">
        <input type="checkbox" id="terms" className="mt-1 h-4 w-4 rounded border-white/10 bg-[#010409] text-cyan-600 focus:ring-cyan-500/30" required />
        <label htmlFor="terms" className="text-xs leading-normal text-slate-500">
          I accept the <Link href="/knowledge-base" className="text-cyan-400 hover:underline">Security protocols</Link> and acknowledge the{" "}
          <Link href="/knowledge-base" className="text-cyan-400 hover:underline">Data privacy manifesto</Link>.
        </label>
      </div>

      {state.error ? <p className="text-sm text-rose-400">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="tactile-button group flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-600 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(8,145,178,0.2)] hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <ShieldCheck className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        {pending ? "Creating account" : "Create account"}
      </button>
    </form>
  );
}
