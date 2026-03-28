import "server-only";

import { createServerClient } from "@/lib/supabase";
import type { AssessmentRow, InsertAssessmentInput, QuestionRow } from "@/types/database";

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
    return [] as Pick<QuestionRow, "id" | "framework_name" | "framework_reference" | "framework_excerpt">[];
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, framework_name, framework_reference, framework_excerpt")
    .in("id", questionIds)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch framework text: ${error.message}`);
  }

  return (data ?? []) as Pick<QuestionRow, "id" | "framework_name" | "framework_reference" | "framework_excerpt">[];
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
