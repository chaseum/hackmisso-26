import { Lock, Shield } from "lucide-react";
import { redirect } from "next/navigation";
import { NeuralSecHeader } from "@/components/neuralsec-header";
import { QuestionnaireFlow } from "@/components/questionnaire-flow";
import { SetupNotice } from "@/components/site";
import { getAllQuestions, getLatestAssessmentForCurrentUser } from "@/lib/assessment-dal";
import { createServerClientSafe, hasSupabaseEnv } from "@/lib/supabase";
import type { OrgProfile } from "@/types/database";

function normalizeOrgProfile(searchParams: { orgName?: string; orgType?: string; orgSize?: string }): OrgProfile {
  return {
    name: typeof searchParams.orgName === "string" ? searchParams.orgName.trim() : "",
    type:
      searchParams.orgType === "Nonprofit" ||
      searchParams.orgType === "Small Business" ||
      searchParams.orgType === "Student Organization" ||
      searchParams.orgType === "Startup"
        ? searchParams.orgType
        : "Nonprofit",
    size:
      searchParams.orgSize === "1-10" || searchParams.orgSize === "11-50" || searchParams.orgSize === "50+"
        ? searchParams.orgSize
        : "1-10",
  };
}

function hasProfileOverrides(searchParams: { orgName?: string; orgType?: string; orgSize?: string }) {
  return Boolean(searchParams.orgName || searchParams.orgType || searchParams.orgSize);
}

export default async function QuestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ orgName?: string; orgType?: string; orgSize?: string }>;
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

  const [questions, latestAssessment, params] = await Promise.all([
    getAllQuestions(),
    getLatestAssessmentForCurrentUser(),
    searchParams,
  ]);
  const useExistingProfile = Boolean(latestAssessment) && !hasProfileOverrides(params);
  const initialOrgProfile = useExistingProfile && latestAssessment
    ? latestAssessment.org_profile
    : normalizeOrgProfile(params);

  return (
    <main className="homepage-grid relative flex min-h-screen flex-col overflow-x-hidden bg-[#010409] text-slate-300">
      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center opacity-10">
        <div className="h-[34rem] w-[34rem] rounded-full border border-cyan-500/10" />
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

      <section className="relative z-20 flex flex-1 px-6 py-14">
        <QuestionnaireFlow
          questions={questions}
          initialOrgProfile={initialOrgProfile}
          hasExistingAssessment={Boolean(latestAssessment)}
        />
      </section>
    </main>
  );
}
