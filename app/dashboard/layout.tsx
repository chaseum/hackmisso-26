import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard";
import { SetupNotice } from "@/components/site";
import { createServerClientSafe, hasSupabaseEnv } from "@/lib/supabase";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) return <DashboardShell><SetupNotice /></DashboardShell>;
  const supabase = await createServerClientSafe();
  if (!supabase) return <DashboardShell><SetupNotice /></DashboardShell>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return <DashboardShell>{children}</DashboardShell>;
}
