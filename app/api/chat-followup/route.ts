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
  conversationHistory?: unknown;
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

function isJsonObject(value: unknown): value is { [key: string]: JsonValue } {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isConversationHistory(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Record<string, unknown>;
    return (
      (candidate.role === "assistant" || candidate.role === "user") &&
      typeof candidate.content === "string"
    );
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FollowUpRequestBody;
    const userPrompt = body.userPrompt;
    const assessmentResults = body.assessmentResults;
    const conversationHistory = isConversationHistory(body.conversationHistory) ? body.conversationHistory.slice(-6) : [];

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
            content: `You are a cybersecurity expert consulting a small organization. You are reviewing their recent assessment results: ${JSON.stringify(assessmentResults)}.

Answer the user's next question using the assessment data and recent conversation context only.

Response rules:
- Keep the answer concise, direct, and practical.
- Use plain language for non-experts.
- Prefer short paragraphs or simple bullet points.
- Avoid markdown headings, code fences, and decorative asterisks.
- If you mention a fix, include the first realistic step to take.
- When relevant, refer to the specific vulnerability or framework reference from the assessment.
- Keep the answer under 140 words.`,
          },
          ...conversationHistory.map((message) => ({
            role: message.role,
            content: message.content,
          })),
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
