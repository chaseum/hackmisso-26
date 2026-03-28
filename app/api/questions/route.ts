import { NextResponse } from "next/server";
import { getAllQuestions } from "@/lib/assessment-dal";

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
