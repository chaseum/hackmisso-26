import "server-only";

import type { AssessmentRecommendation, OrgProfile } from "@/types/database";

export type FailedQuestionContext = {
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

function parseOpenAIJson(content: string) {
  try {
    return JSON.parse(content) as OpenAIRecommendationsResponse;
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }
}

export function buildFallbackRecommendations(
  failedQuestions: FailedQuestionContext[],
): AssessmentRecommendation[] {
  if (failedQuestions.length === 0) {
    return [
      {
        title: "No failed controls detected",
        priority: "low",
        framework_reference: undefined,
        why_it_matters: "All submitted answers were marked compliant, so there are no failed controls requiring remediation right now.",
        actionable_fix: "Keep the documented controls current and rerun the assessment after any major tooling, staffing, or process change.",
        summary: "All submitted answers were marked compliant, so there are no failed controls requiring remediation right now. Keep the documented controls current and rerun the assessment after any major tooling, staffing, or process change.",
      },
    ];
  }

  return failedQuestions.slice(0, 5).map((question) => {
    const priority = question.priorityScore >= 3 ? "high" : "medium";
    const whyItMatters =
      `If this control stays unresolved, ${question.category.toLowerCase()} weaknesses are more likely to lead to account compromise, avoidable downtime, or data exposure for the organization.`;
    const actionableFix =
      `Assign one owner to address "${question.questionText}" and implement the control described in ${question.frameworkReference} this week, starting with the simplest change your team can complete immediately.`;

    return {
      title: `Address ${question.frameworkReference} before it becomes an operational risk`,
      priority,
      framework_reference: question.frameworkReference,
      why_it_matters: whyItMatters,
      actionable_fix: actionableFix,
      summary: `${whyItMatters} ${actionableFix}`,
    };
  });
}

export async function generateCyberRecommendations(
  failedQuestions: FailedQuestionContext[],
  orgProfile: OrgProfile,
) {
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
          content: `
You are a cybersecurity expert consulting for a ${orgProfile.size}-person ${orgProfile.type} named ${orgProfile.name || "the client"}.

You will receive failed security controls, including:
- the original yes/no assessment question
- framework reference
- enriched framework excerpt text
- category
- priority score
- risk weight
- effort level

Your job is to convert those failed controls into a practical remediation report for a non-technical business owner.
Tailor your recommendations to the organization's size and type. Prefer low-cost, realistic actions for small teams when appropriate.

Return strict JSON only.
Return a single object with one key: "recommendations".
"recommendations" must be an array of objects.

Each recommendation object must use exactly these keys:
- "title"
- "priority"
- "why_it_matters"
- "actionable_fix"
- "framework_reference"

Hard rules:
1. Do not restate or lightly rewrite the failed question.
2. Do not say generic things like "improve security" or "follow best practices."
3. "why_it_matters" must explain the actual business consequence in plain English, such as account takeover, payroll fraud, ransomware impact, loss of customer trust, downtime, data exposure, or inability to recover operations.
4. "actionable_fix" must provide a specific first step the business can take now.
5. Prefer practical first actions over long-term strategy.
6. Keep every field concise and useful.
7. "priority" must be exactly one of: "low", "medium", "high".
8. Use the provided framework reference exactly as written.
9. If multiple failed controls are similar, keep each recommendation distinct and tied to that control's actual risk.
10. Do not include markdown, commentary, or any text outside the JSON object.
11. Base recommendations only on the supplied failed controls and framework context.
          `.trim(),
        },
        {
          role: "user",
          content: [
            "Generate prioritized remediation recommendations for these failed cybersecurity controls.",
            "Do not restate the control or paraphrase the yes/no question.",
            "Use the enriched framework excerpt text as retrieval context.",
            "Focus on business consequence and the first practical action.",
            "",
            JSON.stringify(promptPayload, null, 2),
          ].join("\n"),
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

  return parsed.recommendations.map((recommendation) => ({
    ...recommendation,
    summary: recommendation.summary ?? `${recommendation.why_it_matters} ${recommendation.actionable_fix}`.trim(),
  }));
}
