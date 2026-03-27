import { redirect } from "next/navigation";
import { ActivityFeed, DashboardIntro, DashboardStats, NotesPanel, ProjectOverviewCard, ProjectSections, ProjectSettingsCard, getDashboardData } from "@/components/dashboard";
import { SetupNotice } from "@/components/site";
import { createServerClientSafe, hasSupabaseEnv } from "@/lib/supabase";

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) return <SetupNotice />;
  const supabase = await createServerClientSafe();
  if (!supabase) return <SetupNotice />;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const data = await getDashboardData(supabase, user.id);

  return (
    <div className="space-y-8">
      <DashboardIntro profile={data.profile} project={data.project} />
      <DashboardStats notesCount={data.notes.length} hasProject={Boolean(data.project)} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <ProjectOverviewCard project={data.project} />
          <ProjectSections />
          <NotesPanel notes={data.notes} projectId={data.project?.id ?? null} />
          <ActivityFeed notes={data.notes} />
        </div>
        <div className="space-y-6"><ProjectSettingsCard profile={data.profile} project={data.project} /></div>
      </div>
    </div>
  );
}
