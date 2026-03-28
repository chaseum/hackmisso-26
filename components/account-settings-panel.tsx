"use client";

import { useActionState } from "react";
import { AlertTriangle, KeyRound, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import {
  deleteAccountAction,
  updateAccountEmailAction,
  updateAccountPasswordAction,
  updateAccountProfileAction,
} from "@/lib/actions";

const initialState = { error: "", success: "" };
const ORG_FOCUS_OPTIONS = [
  "Education",
  "Healthcare",
  "Community Services",
  "Advocacy",
  "Arts & Culture",
  "Faith-Based",
  "Environment",
  "Housing",
  "Technology",
  "Other",
] as const;

export function AccountSettingsPanel({
  email,
  fullName,
  teamName,
  orgFocus,
  deleteEnabled,
}: {
  email: string;
  fullName: string;
  teamName: string;
  orgFocus: string;
  deleteEnabled: boolean;
}) {
  const [profileState, profileAction, profilePending] = useActionState(updateAccountProfileAction, initialState);
  const [emailState, emailAction, emailPending] = useActionState(updateAccountEmailAction, initialState);
  const [passwordState, passwordAction, passwordPending] = useActionState(updateAccountPasswordAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccountAction, initialState);

  return (
    <div className="grid gap-6">
      <section className="card-glass rounded-[2rem] p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Profile</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Update the organization name and account holder name shown across your SeKeyity workspace.
            </p>
          </div>
        </div>

        <form action={profileAction} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Full name</span>
              <input
                type="text"
                name="full_name"
                defaultValue={fullName}
                className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Organization name</span>
              <input
                type="text"
                name="team_name"
                defaultValue={teamName}
                className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">What does your organization do?</span>
            <select
              name="org_focus"
              defaultValue={orgFocus || "Community Services"}
              className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
            >
              {ORG_FOCUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {profileState.error ? <p className="text-sm text-rose-400">{profileState.error}</p> : null}
          {profileState.success ? <p className="text-sm text-cyan-300">{profileState.success}</p> : null}

          <button
            type="submit"
            disabled={profilePending}
            className="tactile-button inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {profilePending ? "Saving profile" : "Save profile"}
          </button>
        </form>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card-glass rounded-[2rem] p-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Email</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Change the email tied to this account. Some Supabase projects require inbox confirmation before the change takes effect.
              </p>
            </div>
          </div>

          <form action={emailAction} className="space-y-5">
            <label className="space-y-2">
              <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Email address</span>
              <input
                type="email"
                name="email"
                defaultValue={email}
                className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
                required
              />
            </label>

            {emailState.error ? <p className="text-sm text-rose-400">{emailState.error}</p> : null}
            {emailState.success ? <p className="text-sm text-cyan-300">{emailState.success}</p> : null}

            <button
              type="submit"
              disabled={emailPending}
              className="tactile-button inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Mail className="h-4 w-4" />
              {emailPending ? "Updating email" : "Update email"}
            </button>
          </form>
        </section>

        <section className="card-glass rounded-[2rem] p-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Password</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Set a new password for this account. Use at least 8 characters.
              </p>
            </div>
          </div>

          <form action={passwordAction} className="space-y-5">
            <label className="space-y-2">
              <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">New password</span>
              <input
                type="password"
                name="password"
                minLength={8}
                className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Confirm password</span>
              <input
                type="password"
                name="confirm_password"
                minLength={8}
                className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
                required
              />
            </label>

            {passwordState.error ? <p className="text-sm text-rose-400">{passwordState.error}</p> : null}
            {passwordState.success ? <p className="text-sm text-cyan-300">{passwordState.success}</p> : null}

            <button
              type="submit"
              disabled={passwordPending}
              className="tactile-button inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <ShieldCheck className="h-4 w-4" />
              {passwordPending ? "Updating password" : "Update password"}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-[2rem] border border-rose-500/20 bg-[linear-gradient(145deg,rgba(251,113,133,0.08),rgba(13,17,23,0.95))] p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Delete account</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              This permanently removes your auth account and cascades through your profile, projects, notes, and related data.
            </p>
          </div>
        </div>

        <form action={deleteAction} className="space-y-5">
          <label className="space-y-2">
            <span className="ml-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Type DELETE to confirm</span>
            <input
              type="text"
              name="confirmation"
              placeholder="DELETE"
              className="input-focus w-full max-w-sm rounded-2xl border border-rose-400/15 bg-[#010409] px-5 py-3.5 text-sm font-medium text-white placeholder:text-slate-700 focus:ring-1 focus:ring-rose-400/40 focus:outline-none"
              required
            />
          </label>

          {!deleteEnabled ? (
            <p className="text-sm text-amber-300">
              Account deletion is disabled until `SUPABASE_SERVICE_ROLE_KEY` is configured on the server.
            </p>
          ) : null}
          {deleteState.error ? <p className="text-sm text-rose-300">{deleteState.error}</p> : null}
          {deleteState.success ? <p className="text-sm text-cyan-300">{deleteState.success}</p> : null}

          <button
            type="submit"
            disabled={deletePending || !deleteEnabled}
            className="tactile-button inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AlertTriangle className="h-4 w-4" />
            {deletePending ? "Deleting account" : "Delete account"}
          </button>
        </form>
      </section>
    </div>
  );
}
