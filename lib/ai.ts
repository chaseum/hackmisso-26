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

type DraftPolicyKind = "password-policy" | "data-breach-response-plan";

const POLICY_LABELS: Record<DraftPolicyKind, string> = {
  "password-policy": "Password Policy",
  "data-breach-response-plan": "Data Breach Response Plan",
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

function buildFallbackPolicyDraft(policyKind: DraftPolicyKind, orgProfile: OrgProfile) {
  const orgName = orgProfile.name || "the organization";
  const orgType = orgProfile.type.toLowerCase();
  const orgSize = orgProfile.size;

  if (policyKind === "password-policy") {
    return `
${orgName} Password Policy

Purpose
This policy explains how ${orgName}, a ${orgType}, protects email, cloud tools, shared files, finance systems, and any other accounts used by staff, volunteers, officers, or student leaders.

Scope
This policy applies to all accounts used for ${orgName} operations, including administrator accounts, email, fundraising tools, file storage, banking portals, and devices that store organizational data.

Password Requirements
1. Every account must use a unique password that is not reused on any other service.
2. Passwords should be at least 14 characters long or use a passphrase with at least four random words.
3. Default passwords must be changed immediately before a system goes into use.
4. Shared accounts should be avoided. If one is unavoidable, access must be limited and the password must be rotated whenever a person with access leaves the team.

Password Management
1. ${orgName} should store passwords in an approved password manager.
2. Passwords must not be shared in email, chat, spreadsheets, or paper notes left in visible locations.
3. Administrator and finance-related credentials must be reviewed at least quarterly.

Multi-Factor Authentication
1. MFA is required on administrator, email, finance, and file-sharing accounts.
2. MFA must be enabled before new leaders or staff receive privileged access.

Account Changes
1. When a staff member, volunteer, or officer leaves, their accounts must be disabled or transferred within 24 hours.
2. Passwords for sensitive shared systems must be changed immediately after role changes or suspected exposure.

Incident Handling
If a password is suspected to be exposed, the account owner must change it immediately, enable or confirm MFA, and notify the designated security lead.

Policy Owner
The executive director, president, or designated technology lead is responsible for maintaining this policy for a ${orgSize} team and reviewing it at least once per year.
    `.trim();
  }

  return `
${orgName} Data Breach Response Plan

Purpose
This plan provides a simple response process for ${orgName}, a ${orgType}, if personal data, donor information, student records, credentials, or internal files are exposed, stolen, or accessed without permission.

Scope
This plan applies to any suspected or confirmed security incident involving systems, accounts, devices, email, cloud storage, or third-party platforms used by ${orgName}.

Response Team
1. Incident Lead: the executive director, president, or designated technology lead.
2. Communications Lead: the person responsible for board, faculty advisor, donor, or community updates.
3. Technical Support: any internal admin, volunteer, or outside IT partner helping contain the issue.

Response Steps
1. Identify: Confirm what happened, when it started, and which systems or accounts may be involved.
2. Contain: Reset passwords, disable compromised accounts, disconnect affected devices, and limit access to impacted systems.
3. Preserve Evidence: Save logs, screenshots, emails, and timestamps before making major changes.
4. Assess Impact: Determine what data may have been exposed and which people could be affected.
5. Notify Leadership: Brief the board chair, faculty advisor, or leadership team as soon as practical.
6. Notify Affected Parties: If sensitive data may have been exposed, prepare a plain-language notice explaining what happened, what data was involved, and what actions recipients should take.
7. Recover: Restore normal operations, validate account security, and confirm backups or services are functioning properly.
8. Review: Within seven days, document lessons learned and assign follow-up fixes.

Documentation Requirements
The incident lead must keep a simple written record of the date, systems affected, actions taken, notifications sent, and remaining remediation items.

External Support
${orgName} should contact its technology vendor, cyber insurance contact, legal counsel, or faculty/parent institution when the incident involves regulated data, financial systems, or law enforcement concerns.

Plan Maintenance
This plan should be reviewed annually and after any major incident so it remains practical for a ${orgSize} organization.
  `.trim();
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

export async function generatePolicyDraft({
  policyKind,
  orgProfile,
}: {
  policyKind: DraftPolicyKind;
  orgProfile: OrgProfile;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildFallbackPolicyDraft(policyKind, orgProfile);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "text" },
      messages: [
        {
          role: "system",
          content: `
You write practical cybersecurity policy drafts for small organizations.

The user needs a copy-pasteable first draft that is customized, plain English, and appropriate for non-technical leaders.

Requirements:
1. Produce a complete draft policy document only.
2. Do not include markdown fences.
3. Use short headings and concise sections.
4. Keep it realistic for smaller teams with limited budget.
5. Mention the organization name naturally throughout the draft.
6. Include a review/owner section.
7. Avoid legal claims or state-specific compliance language.
          `.trim(),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              requested_policy: POLICY_LABELS[policyKind],
              organization_profile: orgProfile,
            },
            null,
            2,
          ),
        },
      ],
    }),
  });

  if (!response.ok) {
    return buildFallbackPolicyDraft(policyKind, orgProfile);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();

  return content || buildFallbackPolicyDraft(policyKind, orgProfile);
}
