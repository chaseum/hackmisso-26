import { NextResponse } from "next/server";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type FollowUpRequestBody = {
  userPrompt?: unknown;
  assessmentResults?: unknown;
};

function isJsonObject(value: unknown): value is { [key: string]: JsonValue } {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FollowUpRequestBody;
    const userPrompt = body.userPrompt;
    const assessmentResults = body.assessmentResults;

    if (typeof userPrompt !== "string" || userPrompt.trim().length === 0) {
      return NextResponse.json({ error: "Request must include a non-empty `userPrompt`." }, { status: 400 });
    }

    if (!isJsonObject(assessmentResults)) {
      return NextResponse.json({ error: "Request must include an `assessmentResults` object." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY." }, { status: 500 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `You are a cybersecurity expert consulting a small business. You are reviewing their recent risk assessment results: ${JSON.stringify(assessmentResults)}. The user will ask a specific follow-up question. Answer their question strictly based on the provided assessment data. Keep your answer under 3 paragraphs, highly actionable, jargon-free, and directly reference the specific tools or fixes mentioned in the assessment.`,
          },
          {
            role: "user",
            content: userPrompt,
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

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("OpenAI returned an empty response.");
    }

    return NextResponse.json({ response: content }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while generating follow-up guidance.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
