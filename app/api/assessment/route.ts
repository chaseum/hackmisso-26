import { NextResponse } from "next/server";
import { getAllQuestions, getFrameworkTextForFailedQuestions, insertCompletedAssessment } from "@/lib/assessment-dal";
import type { AssessmentRecommendation, AssessmentResponse, QuestionRow } from "@/types/database";

type AssessmentAnswerInput = {
  questionId: string;
  userAnsweredYes: boolean;
};

type AssessmentRequestBody =
  | AssessmentAnswerInput[]
  | {
      answers: AssessmentAnswerInput[];
    };

type FailedQuestionContext = {
  questionId: string;
  questionText: string;
  category: string;
  riskWeight: number;
  effortLevel: number;
  priorityScore: number;
  frameworkName: string;
  frameworkReference: string;
  frameworkExcerpt: string;
};

type OpenAIRecommendationsResponse = {
  recommendations?: AssessmentRecommendation[];
};

function normalizeAnswers(body: AssessmentRequestBody) {
  if (Array.isArray(body)) {
    return body;
  }

  if (body && Array.isArray(body.answers)) {
    return body.answers;
  }

  return null;
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

function parseOpenAIJson(content: string) {
  try {
    return JSON.parse(content) as OpenAIRecommendationsResponse;
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }
}

function formatRecommendationsAsMarkdown(recommendations: AssessmentRecommendation[]) {
  if (recommendations.length === 0) {
    return [
      "# Cybersecurity Recommendations",
      "",
      "## Executive Summary",
      "- No remediation recommendations were generated.",
    ].join("\n");
  }

  return [
    "# Cybersecurity Recommendations",
    "",
    "## Executive Summary",
    `- ${recommendations.length} prioritized recommendation(s) were generated from the failed controls.`,
    "",
    "## Prioritized Recommendations",
    ...recommendations.map((recommendation, index) =>
      [
        `### ${index + 1}. ${recommendation.title}`,
        `- Priority: ${recommendation.priority ?? "unspecified"}`,
        recommendation.framework_reference
          ? `- Framework reference: ${recommendation.framework_reference}`
          : null,
        `- Action: ${recommendation.summary}`,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ].join("\n\n");
}

async function generateRecommendations(failedQuestions: FailedQuestionContext[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const promptPayload = failedQuestions.map((question) => ({
    question_id: question.questionId,
    question_text: question.questionText,
    category: question.category,
    priority_score: question.priorityScore,
    risk_weight: question.riskWeight,
    effort_level: question.effortLevel,
    framework_name: question.frameworkName,
    framework_reference: question.frameworkReference,
    framework_excerpt: question.frameworkExcerpt,
  }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a cybersecurity assessment assistant. Return strict JSON with a top-level `recommendations` array. Each recommendation must include `title`, `summary`, optional `framework_reference`, and optional `priority` set to low, medium, or high.",
        },
        {
          role: "user",
          content: `Generate prioritized remediation recommendations for these failed cybersecurity controls. Keep each summary concise and actionable for a small business team.\n\n${JSON.stringify(promptPayload, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = parseOpenAIJson(content);
  if (!Array.isArray(parsed.recommendations)) {
    throw new Error("OpenAI response did not include a recommendations array.");
  }

  return parsed.recommendations;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssessmentRequestBody;
    const answers = normalizeAnswers(body);

    if (!answers || answers.length === 0) {
      return NextResponse.json({ error: "Request body must include at least one answer." }, { status: 400 });
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

    const failedQuestions: FailedQuestionContext[] = rawResponses
      .filter((response) => !response.userAnsweredYes)
      .map((response) => {
        const question = questionMap.get(response.questionId);
        const framework = frameworkMap.get(response.questionId);

        if (!question || !framework) {
          throw new Error(`Missing question or framework context for ${response.questionId}.`);
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
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);

    const totalScore = rawResponses.reduce(
      (sum, response) => sum + (response.userAnsweredYes ? response.riskWeight : 0),
      0,
    );
    const maxPossibleScore = rawResponses.reduce((sum, response) => sum + response.riskWeight, 0);
    const scorePercent = maxPossibleScore === 0 ? 0 : Number(((totalScore / maxPossibleScore) * 100).toFixed(2));
    const highPriorityFlags = failedQuestions.filter((question) => question.priorityScore >= 3).length;

    const recommendations =
      failedQuestions.length === 0
        ? ([
            {
              title: "No failed controls detected",
              summary: "All submitted answers were marked compliant, so no remediation steps were generated.",
              priority: "low",
            },
          ] satisfies AssessmentRecommendation[])
        : await generateRecommendations(failedQuestions);
    const recommendationsMarkdown = formatRecommendationsAsMarkdown(recommendations);

    const assessment = await insertCompletedAssessment({
      total_score: totalScore,
      score_percent: scorePercent,
      high_priority_flags: highPriorityFlags,
      raw_responses: rawResponses,
      failed_question_ids: failedQuestions.map((question) => question.questionId),
      ai_recommendations: recommendationsMarkdown,
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
