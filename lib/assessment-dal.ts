import "server-only";

import { createServerClient } from "@/lib/supabase";
import type { AssessmentRow, InsertAssessmentInput, QuestionRow } from "@/types/database";

type FrameworkContextRow = Pick<
  QuestionRow,
  "id" | "display_order" | "framework_name" | "framework_reference" | "framework_excerpt"
>;

export async function getAllQuestions() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  return (data ?? []) as QuestionRow[];
}

export async function getFrameworkTextForFailedQuestions(questionIds: string[]) {
  if (questionIds.length === 0) {
    return [] as FrameworkContextRow[];
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, display_order, framework_name, framework_reference, framework_excerpt")
    .in("id", questionIds)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch enriched framework excerpts: ${error.message}`);
  }

  return (data ?? []) as FrameworkContextRow[];
}

export async function getQuestionsByIds(questionIds: string[]) {
  if (questionIds.length === 0) {
    return [] as QuestionRow[];
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .in("id", questionIds)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch selected questions: ${error.message}`);
  }

  return (data ?? []) as QuestionRow[];
}

export async function insertCompletedAssessment(input: InsertAssessmentInput) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      user_id: user.id,
      total_score: input.total_score,
      score_percent: input.score_percent,
      high_priority_flags: input.high_priority_flags,
      raw_responses: input.raw_responses,
      failed_question_ids: input.failed_question_ids,
      ai_recommendations: input.ai_recommendations,
      org_profile: input.org_profile,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert assessment: ${error.message}`);
  }

  return data as AssessmentRow;
}

export async function getLatestAssessmentForCurrentUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch latest assessment: ${error.message}`);
  }

  return data as AssessmentRow | null;
}
