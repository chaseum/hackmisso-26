import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/site";
import { createServerClientSafe, hasSupabaseEnv } from "@/lib/supabase";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) return <SetupNotice />;
  const supabase = await createServerClientSafe();
  if (!supabase) return <SetupNotice />;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return <>{children}</>;
}
