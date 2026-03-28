import "server-only";

import type { AssessmentRecommendation } from "@/types/database";

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

export function formatRecommendationsAsMarkdown(recommendations: AssessmentRecommendation[]) {
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

export function buildFallbackRecommendations(
  failedQuestions: FailedQuestionContext[],
): AssessmentRecommendation[] {
  if (failedQuestions.length === 0) {
    return [
      {
        title: "No failed controls detected",
        summary: "All submitted answers were marked compliant, so no remediation steps were generated.",
        priority: "low",
      },
    ];
  }

  return failedQuestions.slice(0, 5).map((question) => ({
    title: `Review ${question.frameworkReference}`,
    summary: `If this control is left unresolved, the business is more exposed to preventable disruption or account compromise. Start by assigning one owner to address "${question.questionText}" and implement the framework control this week.`,
    framework_reference: question.frameworkReference,
    priority: question.priorityScore >= 3 ? "high" : "medium",
  }));
}

export async function generateCyberRecommendations(
  failedQuestions: FailedQuestionContext[],
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
You are a cybersecurity risk advisor for small businesses and nonprofits.

You will receive failed security controls, including:
- the original yes/no assessment question
- framework reference and excerpt
- category
- priority score
- risk weight
- effort level

Your job is to convert those failed controls into a practical remediation report for a non-technical business owner.

Return strict JSON only.
Return a single object with one key: "recommendations".
"recommendations" must be an array of objects.

Each recommendation object must use exactly these keys:
- "title"
- "summary"
- "priority"
- "framework_reference"

Hard rules:
1. Do not restate or lightly rewrite the failed question.
2. Do not say generic things like "improve security" or "follow best practices."
3. Explain the actual business consequence in plain English, such as account takeover, payroll fraud, ransomware impact, loss of customer trust, downtime, data exposure, or inability to recover operations.
4. The "summary" must include both:
   - why it matters in plain English
   - a specific first step the business can take now
5. Prefer practical first actions over long-term strategy.
6. Keep every field concise and useful.
7. "priority" must be exactly one of: "low", "medium", "high".
8. Use the provided framework reference exactly as written.
9. If multiple failed controls are similar, keep each recommendation distinct and tied to that control's actual risk.
10. Do not include markdown, commentary, or any text outside the JSON object.

Writing guidance:
- "title": short, concrete, risk-oriented, not a reworded question
- "summary": 2-4 sentences, with the first part explaining what could realistically go wrong for this business and the second part giving 1-2 practical first actions a small team can start this week

Bad example:
- title: "Enable Backups"
- summary: "Backups are important for security. Set up backups."

Good example:
- title: "A Single Ransomware Incident Could Wipe Out Critical Records"
- summary: "If files are encrypted or deleted, the business can lose customer records, financial data, and the ability to keep operating. Turn on automatic daily backups for the most important systems and keep one copy somewhere employee laptops and shared drives cannot reach."

Base recommendations only on the supplied failed controls and framework context.
          `.trim(),
        },
        {
          role: "user",
          content: [
            "Generate prioritized remediation recommendations for these failed cybersecurity controls.",
            "Do not restate the control or paraphrase the yes/no question.",
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

  return parsed.recommendations;
}
