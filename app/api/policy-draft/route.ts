import { NextResponse } from "next/server";
import { generatePolicyDraft } from "@/lib/ai";
import { getLatestAssessmentForCurrentUser } from "@/lib/assessment-dal";
import { createServerClient } from "@/lib/supabase";
import type { OrgProfile } from "@/types/database";

type DraftPolicyKind = "password-policy" | "data-breach-response-plan";

type RequestBody = {
  policyKind?: unknown;
  recommendationTitle?: unknown;
  frameworkReference?: unknown;
};

const encoder = new TextEncoder();

function isValidPolicyKind(value: unknown): value is DraftPolicyKind {
  return value === "password-policy" || value === "data-breach-response-plan";
}

function normalizeOrgProfile(
  assessmentProfile: OrgProfile | null | undefined,
  fallbackName: string,
  fallbackFocus: string | null | undefined,
) {
  const baseProfile = assessmentProfile ?? {
    name: fallbackName,
    type: "Nonprofit" as const,
    size: "1-10" as const,
  };

  const scopedName =
    fallbackFocus && fallbackFocus.trim().length > 0
      ? `${baseProfile.name || fallbackName} (${fallbackFocus.trim()})`
      : baseProfile.name || fallbackName;

  return {
    ...baseProfile,
    name: scopedName,
  } satisfies OrgProfile;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!isValidPolicyKind(body.policyKind)) {
      return NextResponse.json({ error: "A valid policy kind is required." }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const assessment = await getLatestAssessmentForCurrentUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("team_name, org_focus")
      .eq("id", user.id)
      .maybeSingle();

    const fallbackName =
      profile?.team_name ||
      (typeof user.user_metadata.team_name === "string" ? user.user_metadata.team_name : "") ||
      "your organization";

    const orgProfile = normalizeOrgProfile(assessment?.org_profile, fallbackName, profile?.org_focus);
    const draft = await generatePolicyDraft({
      policyKind: body.policyKind,
      orgProfile,
    });

    const chunks = draft.match(/.{1,180}(\s|$)/g) ?? [draft];
    const stream = new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Recommendation-Title":
          typeof body.recommendationTitle === "string" ? body.recommendationTitle : "Generated policy draft",
        "X-Framework-Reference":
          typeof body.frameworkReference === "string" ? body.frameworkReference : "",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate draft policy.";
    const status = message === "You must be signed in." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
