import "server-only";

import { createServerClient } from "@/lib/supabase";
import { getMitigationBoost } from "@/lib/mitigations";
import { getLatestAssessmentForCurrentUser, getQuestionsByIds } from "@/lib/assessment-dal";
import type { AssessmentRecommendation, AssessmentRow, QuestionRow } from "@/types/database";

export type AssessmentAlert = {
  level: "high risk" | "medium risk" | "low risk";
  levelClassName: string;
  title: string;
  description: string;
  frameworkReference?: string;
};

export type AssessmentVulnerability = {
  questionId: string;
  title: string;
  description: string;
  category: string;
  frameworkName: string;
  frameworkReference: string;
  priority: "high" | "medium" | "low";
  priorityScore: number;
  actionableFix?: string;
};

export type AssessmentReportData = {
  assessment: AssessmentRow | null;
  alerts: AssessmentAlert[];
  recommendations: AssessmentRecommendation[];
  vulnerabilities: AssessmentVulnerability[];
  securityScore: number;
  riskScorePercent: number;
  mitigatedAlertTitles: string[];
  postureLabel: string;
  orgName: string;
};

export type VulnerabilityBreakdownItem = {
  label: string;
  count: number;
  percentage: number;
  color: { red: number; green: number; blue: number };
};

const simpleVulnerabilitySummaries: Record<string, { title: string; description: string }> = {
  q1: {
    title: "Unknown devices may be using company systems",
    description: "The team does not have a reliable list of devices, so unmanaged laptops or phones could connect without being noticed.",
  },
  q2: {
    title: "Former staff may still have account access",
    description: "Old employee or volunteer accounts may remain active after people leave, creating an easy path back into email and business tools.",
  },
  q3: {
    title: "Critical accounts are missing MFA protection",
    description: "Important systems can be accessed with just a password, which makes stolen or guessed credentials much more dangerous.",
  },
  q4: {
    title: "Systems may stay exposed to known software flaws",
    description: "Computers or servers are not updating fast enough, so attackers can exploit known bugs that already have fixes available.",
  },
  q5: {
    title: "Sensitive data may be visible to too many people",
    description: "Access to important files or records is broader than it should be, increasing the chance of leaks, mistakes, or misuse.",
  },
  q6: {
    title: "Weak password practices increase account takeover risk",
    description: "Accounts may be using reused or unmanaged passwords, making it easier for one exposed password to compromise multiple systems.",
  },
  q7: {
    title: "Staff may be unprepared for phishing and scams",
    description: "Without regular security training, employees are more likely to click malicious links or share information with attackers.",
  },
  q8: {
    title: "Devices may be missing active malware protection",
    description: "Some company devices may not be running current antivirus or anti-malware tools, which makes common threats harder to stop early.",
  },
  q9: {
    title: "Incident response may be improvised during an attack",
    description: "There is no clear written response plan, so the team may lose time deciding what to do during a real security incident.",
  },
  q10: {
    title: "Recovery may fail if important data is lost",
    description: "Backups may not be isolated or frequent enough, which can make ransomware or accidental deletion much more damaging.",
  },
};

const priorityRank: Record<NonNullable<AssessmentRecommendation["priority"]>, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function getPostureLabel(securityScore: number) {
  if (securityScore >= 80) {
    return "Healthy posture";
  }

  if (securityScore >= 60) {
    return "Moderate posture";
  }

  return "Needs attention";
}

export function getSecurityScore(riskScorePercent: number) {
  return Math.max(0, 100 - Math.round(riskScorePercent));
}

export function getSecurityLetterGrade(securityScore: number) {
  if (securityScore >= 90) return "A";
  if (securityScore >= 80) return "B";
  if (securityScore >= 65) return "C";
  if (securityScore >= 50) return "D";
  return "F";
}

export function buildVulnerabilityBreakdown(vulnerabilities: AssessmentVulnerability[]): VulnerabilityBreakdownItem[] {
  if (vulnerabilities.length === 0) {
    return [];
  }

  const colors = [
    { red: 34 / 255, green: 211 / 255, blue: 238 / 255 },
    { red: 16 / 255, green: 185 / 255, blue: 129 / 255 },
    { red: 251 / 255, green: 191 / 255, blue: 36 / 255 },
    { red: 217 / 255, green: 70 / 255, blue: 239 / 255 },
    { red: 251 / 255, green: 113 / 255, blue: 133 / 255 },
  ];

  return Object.entries(
    vulnerabilities.reduce<Record<string, number>>((accumulator, vulnerability) => {
      accumulator[vulnerability.category] = (accumulator[vulnerability.category] ?? 0) + 1;
      return accumulator;
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .map(([label, count], index) => ({
      label,
      count,
      percentage: Number(((count / vulnerabilities.length) * 100).toFixed(1)),
      color: colors[index % colors.length],
    }));
}

function parseRecommendations(assessment: AssessmentRow | null) {
  if (!assessment?.ai_recommendations) {
    return [] as AssessmentRecommendation[];
  }

  try {
    const parsed = JSON.parse(assessment.ai_recommendations) as AssessmentRecommendation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildAlert(recommendation: AssessmentRecommendation): AssessmentAlert {
  const priority = recommendation.priority ?? "low";

  return {
    level: `${priority} risk` as AssessmentAlert["level"],
    levelClassName:
      priority === "high"
        ? "bg-orange-500/10 text-orange-500"
        : priority === "medium"
          ? "bg-yellow-500/10 text-yellow-500"
          : "bg-cyan-500/10 text-cyan-500",
    title: recommendation.title,
    description: recommendation.actionable_fix,
    frameworkReference: recommendation.framework_reference,
  };
}

function severityFromScore(priorityScore: number): "high" | "medium" | "low" {
  if (priorityScore >= 3) {
    return "high";
  }

  if (priorityScore >= 1.5) {
    return "medium";
  }

  return "low";
}

function buildVulnerabilities(
  assessment: AssessmentRow | null,
  questions: QuestionRow[],
  recommendations: AssessmentRecommendation[],
) {
  if (!assessment) {
    return [] as AssessmentVulnerability[];
  }

  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const recommendationMap = new Map(
    recommendations
      .filter((recommendation) => recommendation.framework_reference)
      .map((recommendation) => [recommendation.framework_reference!, recommendation]),
  );

  const vulnerabilities: AssessmentVulnerability[] = [];

  assessment.raw_responses
    .filter((response) => !response.userAnsweredYes)
    .forEach((response) => {
      const question = questionMap.get(response.questionId);
      if (!question) {
        return;
      }

      const priorityScore = Number((response.riskWeight / Math.max(response.effortLevel, 1)).toFixed(2));
      const matchedRecommendation = recommendationMap.get(question.framework_reference);
      const simpleSummary = simpleVulnerabilitySummaries[question.id];

      vulnerabilities.push({
        questionId: question.id,
        title: simpleSummary?.title ?? question.plain_text_question,
        description: simpleSummary?.description ?? question.framework_excerpt,
        category: question.category,
        frameworkName: question.framework_name,
        frameworkReference: question.framework_reference,
        priority: matchedRecommendation?.priority ?? severityFromScore(priorityScore),
        priorityScore,
        actionableFix: matchedRecommendation?.actionable_fix,
      });
    });

  return vulnerabilities.sort((left, right) => right.priorityScore - left.priorityScore);
}

export async function getLatestAssessmentReportData() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const assessment = await getLatestAssessmentForCurrentUser();
  const recommendations = parseRecommendations(assessment).sort((left, right) => {
    const leftRank = priorityRank[left.priority ?? "low"];
    const rightRank = priorityRank[right.priority ?? "low"];
    return rightRank - leftRank;
  });
  const questions = assessment ? await getQuestionsByIds(assessment.failed_question_ids) : [];
  const vulnerabilities = buildVulnerabilities(assessment, questions, recommendations);
  const alerts = recommendations.map(buildAlert);
  const mitigatedAlertTitles = assessment?.mitigated_alert_titles ?? [];
  const mitigationLift = alerts.reduce((sum, alert) => {
    if (!mitigatedAlertTitles.includes(alert.title)) {
      return sum;
    }

    return sum + getMitigationBoost(alert.level);
  }, 0);
  const { data: profile } = user
    ? await supabase.from("profiles").select("team_name").eq("id", user.id).maybeSingle()
    : { data: null };
  const fallbackOrgName =
    assessment?.org_profile.name ||
    profile?.team_name ||
    (typeof user?.user_metadata.team_name === "string" ? user.user_metadata.team_name : "") ||
    "your organization";

  const riskScorePercent = Math.round(assessment?.score_percent ?? 0);
  const securityScore = Math.min(100, getSecurityScore(riskScorePercent) + mitigationLift);

  return {
    assessment,
    alerts,
    recommendations,
    vulnerabilities,
    securityScore,
    riskScorePercent,
    mitigatedAlertTitles,
    postureLabel: getPostureLabel(securityScore),
    orgName: fallbackOrgName,
  } satisfies AssessmentReportData;
}
