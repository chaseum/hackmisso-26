"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

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
  category: string; //"Quick Win", "Medium Priority", "Major Project"
}

export async function processAssessment(responses: FrontendResponse[]){
  //get authenticated user and supabase client
  const{ supabase, userId } = await getCurrentUserId();

  const vulnerabilities: ProcessedVulnerability[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  for(const response of responses){

    maxPossibleScore += response.riskWeight;

    if(response.userAnsweredYes){
      //secure point
      totalScore += response.riskWeight;
    }
    else{
      //vulnerability, calculate priority
      const priorityScore = response.riskWeight / response.effortLevel;

      let category = "Medium Priority";
      if(priorityScore >= 3.0) category = "Quick Win";
      if(priorityScore <= 1.0 && response.effortLevel === 3) category = "Major Project";

      vulnerabilities.push({
        questionId: response.questionId,
        issue: response.questionText,
        priorityScore: Number(priorityScore.toFixed(2)),
        category: category
      });
    }

    //sort vulnerabilities from highest to lowest priority
    vulnerabilities.sort((a, b) => b.priorityScore - a.priorityScore);
    const overallRiskRating = (totalScore / maxPossibleScore) * 100;

    //quick win count
    const highPriorityCount = vulnerabilities.filter(v => v.priorityScore >= 3.0).length;

    //supabase insert logic
    const{ data, error } = await supabase.from('assessments').insert({
      user_id: userId,
      total_score: totalScore,
      high_priority_flags: highPriorityCount,
      raw_responses: responses //storing original json is case we need it later
    }).select().single();

    if(error){
      throw new Error("Failed to save assessment: " + error.message);
    }

    revalidatePath("/dashboard");

    return{
      success : true,
      assessmentId: data.id,
      securityHealthScore: Math.round(overallRiskRating),
      prioritizedVulnerabilities: vulnerabilities
    };
  }
}