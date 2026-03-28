"use server";

import OpenAI from "openai";
import { getFrameworkTextForFailedQuestions } from "@/lib/assessment-dal";

type RiskScoreData = Record<string, unknown>;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function formatFrameworkContext(
  frameworkRows: Awaited<ReturnType<typeof getFrameworkTextForFailedQuestions>>,
) {
  if (frameworkRows.length === 0) {
    return "No failed framework excerpts were found for the provided question IDs.";
  }

  return frameworkRows
    .map(
      (row, index) =>
        [
          `### Failed Control ${index + 1}`,
          `- Question ID: ${row.id}`,
          `- Framework: ${row.framework_name}`,
          `- Reference: ${row.framework_reference}`,
          `- Excerpt: ${row.framework_excerpt}`,
        ].join("\n"),
    )
    .join("\n\n");
}

export async function generateCyberRecommendations(
  riskScoreData: RiskScoreData,
  failedQuestionIds: string[],
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY.");
    }

    const frameworkRows = await getFrameworkTextForFailedQuestions(failedQuestionIds);
    const frameworkText = formatFrameworkContext(frameworkRows);

    const systemPrompt = [
      "You are an expert cybersecurity consultant helping a small or midsize organization reduce risk quickly.",
      "Use the provided assessment data and framework excerpts to produce pragmatic, prioritized recommendations.",
      "Ground every recommendation in the failed framework context instead of giving generic advice.",
      "Return clear Markdown with headings and bullet points.",
    ].join(" ");

    const userPrompt = `
Risk score data:
${JSON.stringify(riskScoreData, null, 2)}

Failed question IDs:
${JSON.stringify(failedQuestionIds, null, 2)}

Retrieved framework context:
${frameworkText}

Generate a prioritized list of actionable cybersecurity recommendations based specifically on the failed frameworks above.

Requirements:
- Use Markdown.
- Include a short executive summary section.
- Include a prioritized recommendations section with clear headings.
- For each recommendation, explain why it matters, what to do next, and reference the relevant framework item.
- Keep the advice concrete and implementation-oriented for a hackathon/demo-ready product.
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const markdown = completion.choices[0]?.message?.content?.trim();

    if (!markdown) {
      throw new Error("OpenAI returned an empty response.");
    }

    return markdown;
  } catch (error) {
    console.error("Failed to generate cyber recommendations:", error);
    throw new Error("Unable to generate cybersecurity recommendations at this time.");
  }
}
