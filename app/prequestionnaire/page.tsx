import { Lock, Shield } from "lucide-react";
import { redirect } from "next/navigation";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { PrequestionnaireForm } from "@/components/prequestionnaire-form";
import { createServerClientSafe, hasSupabaseEnv } from "@/lib/supabase";
import { SetupNotice } from "@/components/site";

export default async function PrequestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ orgName?: string }>;
}) {
  if (!hasSupabaseEnv()) {
    return <SetupNotice />;
  }

  const supabase = await createServerClientSafe();
  if (!supabase) {
    return <SetupNotice />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const params = await searchParams;
  const initialName = typeof params.orgName === "string" ? params.orgName : "";

  return (
    <main className="homepage-grid relative flex min-h-screen flex-col overflow-x-hidden bg-[#010409] text-slate-300">
      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center opacity-10">
        <div className="h-[30rem] w-[30rem] rounded-full border border-cyan-500/10" />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="homepage-floating absolute top-1/4 left-10 flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-500/10">
          <Shield className="h-5 w-5 text-cyan-500/20" />
        </div>
        <div
          className="homepage-floating absolute right-10 bottom-1/4 flex h-16 w-16 items-center justify-center rounded-full border border-pink-500/10"
          style={{ animationDelay: "-2s" }}
        >
          <Lock className="h-7 w-7 text-pink-500/20" />
        </div>
      </div>

      <NeuralSecHeader
        activeItem="none"
        dashboardHref="/dashboard"
        resourcesHref="/knowledge-base"
        missionHref="/mission-control"
        ctaHref="/dashboard"
        ctaLabel="Dashboard"
        showLogout
      />

      <section className="relative z-20 flex flex-1 items-center justify-center px-6 py-20">
        <PrequestionnaireForm initialName={initialName} />
      </section>

      <footer className="z-20 flex flex-col items-center justify-between gap-6 border-t border-white/5 px-8 py-10 text-[10px] uppercase tracking-widest text-slate-500 md:flex-row [font-family:var(--font-mono)]">
        <div className="flex items-center gap-4">
          <span>(c) 2024 SeKeyity Foundation</span>
          <span className="h-1 w-1 rounded-full bg-slate-700" />
          <span>Open-Source Protocol</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="/knowledge-base" className="transition-colors hover:text-white">Trust center</a>
          <a href="/knowledge-base" className="transition-colors hover:text-white">Compliance</a>
          <a href="/mission-control" className="transition-colors hover:text-white">Tech support</a>
        </div>
      </footer>
    </main>
  );
}
