"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type PrioritizationChatProps = {
  assessmentResults: { [key: string]: JsonValue };
};

const PROMPT_OPTIONS = [
  "What is the single most important thing we should fix this month?",
  "Which improvement reduces the most risk for the lowest effort?",
  "Create a step-by-step 30-day plan to tackle the top priority.",
] as const;

export function PrioritizationChat({ assessmentResults }: PrioritizationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Assessment complete. How can I help you prioritize these fixes?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handlePromptClick(userPrompt: (typeof PROMPT_OPTIONS)[number]) {
    if (isLoading) {
      return;
    }

    setMessages((current) => [...current, { role: "user", content: userPrompt }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-followup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userPrompt,
          assessmentResults,
        }),
      });

      const data = (await response.json()) as { response?: string; error?: string };

      if (!response.ok || !data.response) {
        throw new Error(data.error || "Unable to generate a follow-up response.");
      }

      setMessages((current) => [...current, { role: "assistant", content: data.response! }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error while getting follow-up guidance.";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `I couldn't generate a prioritization response right now. ${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">Prioritization</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 [font-family:var(--font-display)]">
            Constrained Chatbot
          </h2>
        </div>
      </div>

      <div className="mt-6 h-[22rem] overflow-y-auto rounded-[1.75rem] border border-slate-200/80 bg-slate-50/80 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-7 shadow-sm ${
                  message.role === "user"
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isLoading ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <Loader2 className="size-4 animate-spin" />
                Building a focused recommendation...
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {PROMPT_OPTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handlePromptClick(prompt)}
            disabled={isLoading}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>
    </Card>
  );
}
