export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  team_name: string | null;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  summary: string;
  industry: string | null;
  stage: string | null;
  created_at: string;
};

export type NoteRow = {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export type QuestionRow = {
  id: string;
  display_order: number;
  category: string;
  plain_text_question: string;
  risk_weight: number;
  effort_level: number;
  framework_name: string;
  framework_reference: string;
  framework_excerpt: string;
  created_at: string;
};

export type AssessmentRecommendation = {
  title: string;
  summary: string;
  framework_reference?: string;
  priority?: "low" | "medium" | "high";
};

export type OrgProfile = {
  name: string;
  type: "Nonprofit" | "Small Business" | "Student Organization" | "Startup";
  size: "1-10" | "11-50" | "50+";
};

export type AssessmentResponse = {
  questionId: string;
  userAnsweredYes: boolean;
  riskWeight: number;
  effortLevel: number;
  questionText: string;
};

export type AssessmentRow = {
  id: string;
  user_id: string;
  total_score: number;
  score_percent: number;
  high_priority_flags: number;
  raw_responses: AssessmentResponse[];
  failed_question_ids: string[];
  ai_recommendations: string;
  org_profile: OrgProfile;
  created_at: string;
};

export type InsertAssessmentInput = {
  total_score: number;
  score_percent: number;
  high_priority_flags: number;
  raw_responses: AssessmentResponse[];
  failed_question_ids: string[];
  ai_recommendations: string;
  org_profile: OrgProfile;
};
