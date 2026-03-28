import { NextResponse } from "next/server";
import { getAllQuestions, getFrameworkTextForFailedQuestions, insertCompletedAssessment } from "@/lib/assessment-dal";
import type { AssessmentRecommendation, AssessmentResponse, OrgProfile, QuestionRow } from "@/types/database";
import { buildFallbackRecommendations, generateCyberRecommendations, type FailedQuestionContext } from "@/lib/ai";

type AssessmentAnswerInput = {
  questionId: string;
  userAnsweredYes: boolean;
};

type AssessmentRequestBody =
  | AssessmentAnswerInput[]
  | {
      answers?: unknown;
      orgProfile?: unknown;
    };

const DEFAULT_ORG_PROFILE: OrgProfile = {
  name: "",
  type: "Nonprofit",
  size: "1-10",
};

function normalizeAnswers(body: AssessmentRequestBody) {
  if (Array.isArray(body)) {
    return body;
  }

  if (body && typeof body === "object" && Array.isArray(body.answers)) {
    return body.answers;
  }

  return null;
}

function normalizeOrgProfile(body: AssessmentRequestBody) {
  if (!body || Array.isArray(body) || typeof body !== "object") {
    return DEFAULT_ORG_PROFILE;
  }

  const candidate = body.orgProfile;
  if (!candidate || typeof candidate !== "object") {
    return DEFAULT_ORG_PROFILE;
  }

  const partial = candidate as Partial<OrgProfile>;
  return {
    name: typeof partial.name === "string" ? partial.name.trim() : DEFAULT_ORG_PROFILE.name,
    type:
      partial.type === "Nonprofit" ||
      partial.type === "Small Business" ||
      partial.type === "Student Organization" ||
      partial.type === "Startup"
        ? partial.type
        : DEFAULT_ORG_PROFILE.type,
    size:
      partial.size === "1-10" || partial.size === "11-50" || partial.size === "50+"
        ? partial.size
        : DEFAULT_ORG_PROFILE.size,
  };
}

function isValidAnswer(answer: unknown): answer is AssessmentAnswerInput {
  if (!answer || typeof answer !== "object") {
    return false;
  }

  const candidate = answer as Record<string, unknown>;
  return typeof candidate.questionId === "string" && typeof candidate.userAnsweredYes === "boolean";
}

function buildResponseRows(answers: AssessmentAnswerInput[], questionMap: Map<string, QuestionRow>) {
  const responses: AssessmentResponse[] = [];

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) {
      throw new Error(`Unknown question id: ${answer.questionId}`);
    }

    responses.push({
      questionId: question.id,
      userAnsweredYes: answer.userAnsweredYes,
      riskWeight: question.risk_weight,
      effortLevel: question.effort_level,
      questionText: question.plain_text_question,
    });
  }

  return responses;
}

function buildFailedQuestionContexts(
  rawResponses: AssessmentResponse[],
  questionMap: Map<string, QuestionRow>,
  frameworkMap: Map<string, Pick<QuestionRow, "id" | "framework_name" | "framework_reference" | "framework_excerpt">>,
) {
  return rawResponses
    .filter((response) => !response.userAnsweredYes)
    .map((response) => {
      const question = questionMap.get(response.questionId);
      const framework = frameworkMap.get(response.questionId);

      if (!question || !framework) {
        throw new Error(`Missing framework retrieval context for ${response.questionId}.`);
      }

      return {
        questionId: response.questionId,
        questionText: response.questionText,
        category: question.category,
        riskWeight: response.riskWeight,
        effortLevel: response.effortLevel,
        priorityScore: Number((response.riskWeight / response.effortLevel).toFixed(2)),
        frameworkName: framework.framework_name,
        frameworkReference: framework.framework_reference,
        frameworkExcerpt: framework.framework_excerpt,
      } satisfies FailedQuestionContext;
    })
    .sort((left, right) => right.priorityScore - left.priorityScore);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssessmentRequestBody;
    const answers = normalizeAnswers(body);
    const orgProfile = normalizeOrgProfile(body);

    if (!answers || answers.length === 0) {
      return NextResponse.json(
        { error: "Request body must include both an `answers` array and an `orgProfile` object." },
        { status: 400 },
      );
    }

    if (!answers.every(isValidAnswer)) {
      return NextResponse.json(
        { error: "Each answer must include `questionId` and `userAnsweredYes`." },
        { status: 400 },
      );
    }

    const questions = await getAllQuestions();
    const questionMap = new Map(questions.map((question) => [question.id, question]));
    const rawResponses = buildResponseRows(answers, questionMap);

    const failedQuestionIds = rawResponses
      .filter((response) => !response.userAnsweredYes)
      .map((response) => response.questionId);

    const frameworkRows = await getFrameworkTextForFailedQuestions(failedQuestionIds);
    const frameworkMap = new Map(frameworkRows.map((row) => [row.id, row]));
    const failedQuestions = buildFailedQuestionContexts(rawResponses, questionMap, frameworkMap);

    const totalScore = rawResponses.reduce(
      (sum, response) => sum + (!response.userAnsweredYes ? response.riskWeight : 0),
      0,
    );
    const maxPossibleScore = rawResponses.reduce((sum, response) => sum + response.riskWeight, 0);
    const scorePercent = maxPossibleScore === 0 ? 0 : Number(((totalScore / maxPossibleScore) * 100).toFixed(2));
    const highPriorityFlags = failedQuestions.filter((question) => question.priorityScore >= 3).length;

    let recommendations: AssessmentRecommendation[];

    if (failedQuestions.length === 0) {
      recommendations = buildFallbackRecommendations([]);
    } else {
      try {
        recommendations = await generateCyberRecommendations(failedQuestions, orgProfile);
      } catch (error) {
        console.error("Falling back after OpenAI recommendation failure:", error);
        recommendations = buildFallbackRecommendations(failedQuestions);
      }
    }

    const aiRecommendationsJson = JSON.stringify(recommendations);

    const assessment = await insertCompletedAssessment({
      total_score: totalScore,
      score_percent: scorePercent,
      high_priority_flags: highPriorityFlags,
      raw_responses: rawResponses,
      failed_question_ids: failedQuestions.map((question) => question.questionId),
      ai_recommendations: aiRecommendationsJson,
      org_profile: orgProfile,
    });

    return NextResponse.json(
      {
        assessmentId: assessment.id,
        totalScore,
        scorePercent,
        highPriorityFlags,
        failedQuestions,
        recommendations,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while processing assessment.";
    const status = message === "You must be signed in." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  try {
    const questions = await getAllQuestions();
    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while fetching questions.";
    const status = message === "You must be signed in." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
