import { LockKeyhole } from "lucide-react";
import { AccountSettingsPanel } from "@/components/account-settings-panel";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { SetupNotice } from "@/components/site";
import { createServerClientSafe, hasSupabaseEnv, hasSupabaseServiceRoleEnv } from "@/lib/supabase";

export default async function SettingsPage() {
  if (!hasSupabaseEnv()) return <SetupNotice />;

  const supabase = await createServerClientSafe();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <SetupNotice />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, team_name, org_focus")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="grid-bg paper-grid-bg relative flex min-h-screen flex-col bg-[#010409] text-slate-300">
      <NeuralSecHeader
        activeItem="settings"
        dashboardHref="/dashboard"
        resourcesHref="/knowledge-base"
        missionHref="/report"
        ctaHref="/dashboard"
        ctaLabel="Back to Dashboard"
        showLogout
      />

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-8 py-10">
        <section className="flex flex-col gap-4 border-b border-white/5 pb-8">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-cyan-400">
            <LockKeyhole className="h-4 w-4" />
            Account Settings
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">Manage your account</h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Update organization details, change your email or password, and permanently delete your account when needed.
          </p>
        </section>

        <AccountSettingsPanel
          email={user.email ?? ""}
          fullName={profile?.full_name ?? (typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : "")}
          teamName={profile?.team_name ?? (typeof user.user_metadata.team_name === "string" ? user.user_metadata.team_name : "")}
          orgFocus={profile?.org_focus ?? (typeof user.user_metadata.org_focus === "string" ? user.user_metadata.org_focus : "Community Services")}
          deleteEnabled={hasSupabaseServiceRoleEnv()}
        />
      </main>
    </div>
  );
}
