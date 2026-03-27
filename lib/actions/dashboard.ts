"use server";

import { revalidatePath } from "next/cache";
import { insertCompletedAssessment } from "@/lib/assessment-dal";
import { createServerClient } from "@/lib/supabase";
import type { AssessmentRecommendation } from "@/types/database";

async function getCurrentUserId() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return { supabase, userId: user.id, email: user.email ?? "" };
}

export async function updateProfileAction(formData: FormData) {
  const { supabase, userId, email } = await getCurrentUserId();

  const full_name = String(formData.get("full_name") || "").trim();
  const team_name = String(formData.get("team_name") || "").trim();
  const avatar_url = String(formData.get("avatar_url") || "").trim();

  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    email,
    full_name,
    team_name,
    avatar_url,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function saveProjectAction(formData: FormData) {
  const { supabase, userId } = await getCurrentUserId();

  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const industry = String(formData.get("industry") || "").trim();
  const stage = String(formData.get("stage") || "").trim();

  if (!title || !summary) {
    throw new Error("Title and summary are required.");
  }

  const { data: existingProject } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  const payload = {
    owner_id: userId,
    title,
    summary,
    industry,
    stage,
  };

  const query = existingProject
    ? supabase.from("projects").update(payload).eq("id", existingProject.id)
    : supabase.from("projects").insert(payload);

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function addNoteAction(projectId: string | null, formData: FormData) {
  if (!projectId) {
    throw new Error("Create a project before adding notes.");
  }

  const { supabase, userId } = await getCurrentUserId();
  const content = String(formData.get("content") || "").trim();

  if (!content) {
    throw new Error("Note content is required.");
  }

  const { error } = await supabase.from("notes").insert({
    project_id: projectId,
    author_id: userId,
    content,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

//cyber assessment logic

export interface FrontendResponse {
  questionId: string;
  userAnsweredYes: boolean;
  riskWeight: number;
  effortLevel: number;
  questionText: string;
}

export interface ProcessedVulnerability {
  questionId: string;
  issue: string;
  priorityScore: number;
  category: string;
}

export async function processAssessment(responses: FrontendResponse[]) {
  await getCurrentUserId();
  const vulnerabilities: ProcessedVulnerability[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  for (const response of responses) {
    maxPossibleScore += response.riskWeight;

    if (response.userAnsweredYes) {
      totalScore += response.riskWeight;
    } else {
      const priorityScore = response.riskWeight + response.effortLevel;

      let category = "Medium Priority";
      if (priorityScore >= 4) category = "Quick Win";
      if (priorityScore >= 6) category = "Major Project";

      vulnerabilities.push({
        questionId: response.questionId,
        issue: response.questionText,
        priorityScore: Number(priorityScore.toFixed(2)),
        category,
      });
    }
  }

  vulnerabilities.sort((a, b) => b.priorityScore - a.priorityScore);

  const overallRiskRating = maxPossibleScore === 0 ? 0 : (totalScore / maxPossibleScore) * 100;
  const highPriorityCount = vulnerabilities.filter((v) => v.priorityScore >= 4).length;
  const aiRecommendations: AssessmentRecommendation[] = vulnerabilities.map((vulnerability) => ({
    title: vulnerability.issue,
    summary: `Address ${vulnerability.issue.toLowerCase()} to improve your score and reduce near-term cyber risk.`,
    priority: vulnerability.priorityScore >= 6 ? "high" : vulnerability.priorityScore >= 4 ? "medium" : "low",
  }));

  const assessment = await insertCompletedAssessment({
    total_score: totalScore,
    score_percent: Number(overallRiskRating.toFixed(2)),
    high_priority_flags: highPriorityCount,
    raw_responses: responses,
    failed_question_ids: vulnerabilities.map((vulnerability) => vulnerability.questionId),
    ai_recommendations: aiRecommendations,
  });

  revalidatePath("/dashboard");

  return {
    success: true,
    assessmentId: assessment.id,
    securityHealthScore: Math.round(overallRiskRating),
    prioritizedVulnerabilities: vulnerabilities,
  };
}
