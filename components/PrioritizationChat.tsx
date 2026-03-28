"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

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
  results?: { [key: string]: JsonValue };
  assessmentResults?: { [key: string]: JsonValue };
};

const PROMPT_OPTIONS = [
  "What is the absolute cheapest vulnerability I can fix today?",
  "Explain my highest-risk alert to me like I am a beginner.",
  "Create a step-by-step 30-day security plan for my student org.",
] as const;

export function PrioritizationChat({ results, assessmentResults }: PrioritizationChatProps) {
  const payloadResults = results ?? assessmentResults ?? {};
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Assessment complete. How can I help you prioritize these fixes?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastAnimatedAssistantIndexRef = useRef(-1);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(0);
  const [visibleAssistantText, setVisibleAssistantText] = useState(messages[0].content);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const lastMessageIndex = messages.length - 1;
    const lastMessage = messages[lastMessageIndex];

    if (lastMessage?.role === "assistant" && lastMessageIndex > lastAnimatedAssistantIndexRef.current) {
      lastAnimatedAssistantIndexRef.current = lastMessageIndex;
      setTypingMessageIndex(lastMessageIndex);
    }
  }, [messages]);

  useEffect(() => {
    if (typingMessageIndex === null) {
      return;
    }

    const targetMessage = messages[typingMessageIndex];
    if (!targetMessage || targetMessage.role !== "assistant") {
      setTypingMessageIndex(null);
      return;
    }

    setVisibleAssistantText("");
    let currentCharacter = 0;
    const text = targetMessage.content;
    const timer = window.setInterval(() => {
      currentCharacter += 1;
      const nextText = text.slice(0, currentCharacter);
      setVisibleAssistantText(nextText);

      if (currentCharacter >= text.length) {
        window.clearInterval(timer);
        setTypingMessageIndex(null);
      }
    }, 28);

    return () => window.clearInterval(timer);
  }, [messages, typingMessageIndex]);

  const renderedMessages = useMemo(
    () =>
      messages.map((message, index) => ({
        ...message,
        renderedContent:
          message.role === "assistant" && index === typingMessageIndex
            ? visibleAssistantText
            : message.content,
      })),
    [messages, typingMessageIndex, visibleAssistantText],
  );

  function appendAssistantMessage(content: string) {
    setMessages((current) => [...current, { role: "assistant", content }]);
  }

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
          assessmentResults: payloadResults,
        }),
      });

      const data = (await response.json()) as { response?: string; error?: string };

      if (!response.ok || !data.response) {
        throw new Error(data.error || "Unable to generate a follow-up response.");
      }

      appendAssistantMessage(data.response!);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error while getting follow-up guidance.";
      appendAssistantMessage(`I couldn't generate a prioritization response right now. ${message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-cyan-500/12 bg-[#07111d] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.26)]">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/12 text-cyan-200">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Prioritization</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-white [font-family:var(--font-display)]">
            AI Action Assistant
          </h2>
        </div>
      </div>

      <div className="mt-6 h-[24rem] overflow-y-auto rounded-[1.75rem] border border-white/8 bg-[#030b14] p-5">
        <div className="space-y-4">
          {renderedMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-3xl px-5 py-4 text-base leading-8 shadow-sm ${
                  message.role === "user"
                    ? "border border-cyan-300/20 bg-cyan-500/90 font-semibold text-white"
                    : "border border-white/8 bg-[#0b1624] text-slate-100"
                }`}
              >
                {message.renderedContent}
                {message.role === "assistant" && index === typingMessageIndex ? (
                  <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-cyan-200 align-middle" />
                ) : null}
              </div>
            </div>
          ))}

          {isLoading ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-3xl border border-white/8 bg-[#0b1624] px-5 py-4 text-base text-slate-100 shadow-sm">
                <Loader2 className="size-4 animate-spin" />
                Building a shorter recommendation...
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
            className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}
