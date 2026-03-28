import { NextResponse } from "next/server";
import { updateAssessmentMitigations } from "@/lib/assessment-dal";

type MitigationBody = {
  assessmentId?: unknown;
  mitigatedAlertTitles?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MitigationBody;

    if (typeof body.assessmentId !== "string" || body.assessmentId.trim().length === 0) {
      return NextResponse.json({ error: "Request must include a valid `assessmentId`." }, { status: 400 });
    }

    if (!Array.isArray(body.mitigatedAlertTitles) || !body.mitigatedAlertTitles.every((item) => typeof item === "string")) {
      return NextResponse.json({ error: "Request must include `mitigatedAlertTitles` as a string array." }, { status: 400 });
    }

    const assessment = await updateAssessmentMitigations({
      assessmentId: body.assessmentId,
      mitigatedAlertTitles: Array.from(new Set(body.mitigatedAlertTitles.map((item) => item.trim()).filter(Boolean))),
    });

    return NextResponse.json(
      {
        assessmentId: assessment.id,
        mitigatedAlertTitles: assessment.mitigated_alert_titles,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while updating mitigations.";
    const status = message === "You must be signed in." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
