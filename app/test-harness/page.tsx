"use client";

import { useEffect, useState } from "react";
import type { OrgProfile, QuestionRow } from "@/types/database";

type Status = "idle" | "fetching_questions" | "analyzing_risk" | "success" | "error";

type AnswerMap = Record<string, boolean | null>;

type AssessmentResult = {
  assessmentId: string;
  totalScore: number;
  scorePercent: number;
  highPriorityFlags: number;
  failedQuestions: Array<{
    questionId: string;
    questionText: string;
    category: string;
    riskWeight: number;
    effortLevel: number;
    priorityScore: number;
    frameworkName: string;
    frameworkReference: string;
    frameworkExcerpt: string;
  }>;
  recommendations: Array<{
    title: string;
    summary: string;
    framework_reference?: string;
    priority?: "low" | "medium" | "high";
  }>;
};

export default function TestHarnessPage() {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [orgProfile, setOrgProfile] = useState<OrgProfile>({
    name: "",
    type: "Nonprofit",
    size: "1-10",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchQuestions() {
      setStatus("fetching_questions");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/assessment", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const payload = (await response.json()) as {
          questions?: QuestionRow[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load questions.");
        }

        if (!isMounted) {
          return;
        }

        const nextQuestions = payload.questions ?? [];
        setQuestions(nextQuestions);
        setAnswers(
          nextQuestions.reduce<AnswerMap>((accumulator, question) => {
            accumulator[question.id] = null;
            return accumulator;
          }, {}),
        );
        setStatus("idle");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Failed to load questions.");
        setStatus("error");
      }
    }

    void fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleAnswerChange(questionId: string, value: boolean) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("analyzing_risk");
    setErrorMessage(null);
    setResults(null);

    try {
      const payload = questions.map((question) => ({
        questionId: question.id,
        userAnsweredYes: Boolean(answers[question.id]),
      }));

      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: payload,
          orgProfile,
        }),
      });

      const data = (await response.json()) as AssessmentResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to submit assessment.");
      }

      setResults(data);
      setStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit assessment.");
      setStatus("error");
    }
  }

  if (status === "fetching_questions") {
    return <div className="p-4">Loading questions...</div>;
  }

  return (
    <main className="p-4">
      <h1 className="mb-4 text-xl font-semibold">Cyber Risk Assessment Test Harness</h1>

      {errorMessage ? <p className="mb-4 text-red-600">{errorMessage}</p> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="font-medium">Pre-Questionnaire</legend>

          <div>
            <label htmlFor="org-name">Organization Name</label>
            <input
              id="org-name"
              type="text"
              value={orgProfile.name}
              onChange={(event) =>
                setOrgProfile((currentProfile) => ({
                  ...currentProfile,
                  name: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label htmlFor="org-type">Organization Type</label>
            <select
              id="org-type"
              value={orgProfile.type}
              onChange={(event) =>
                setOrgProfile((currentProfile) => ({
                  ...currentProfile,
                  type: event.target.value as OrgProfile["type"],
                }))
              }
            >
              <option value="Nonprofit">Nonprofit</option>
              <option value="Small Business">Small Business</option>
              <option value="Student Organization">Student Organization</option>
              <option value="Startup">Startup</option>
            </select>
          </div>

          <div>
            <label htmlFor="org-size">Organization Size</label>
            <select
              id="org-size"
              value={orgProfile.size}
              onChange={(event) =>
                setOrgProfile((currentProfile) => ({
                  ...currentProfile,
                  size: event.target.value as OrgProfile["size"],
                }))
              }
            >
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="50+">50+</option>
            </select>
          </div>
        </fieldset>

        {questions.map((question) => (
          <fieldset key={question.id} className="space-y-2">
            <legend className="font-medium">{question.plain_text_question}</legend>

            <label className="mr-4 inline-flex items-center gap-2">
              <input
                type="radio"
                name={question.id}
                value="yes"
                checked={answers[question.id] === true}
                onChange={() => handleAnswerChange(question.id, true)}
              />
              <span>Yes</span>
            </label>

            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name={question.id}
                value="no"
                checked={answers[question.id] === false}
                onChange={() => handleAnswerChange(question.id, false)}
              />
              <span>No</span>
            </label>
          </fieldset>
        ))}

        <button
          type="submit"
          disabled={status === "analyzing_risk" || questions.length === 0}
          className="border px-3 py-2 disabled:opacity-50"
        >
          {status === "analyzing_risk" ? "Analyzing risk..." : "Submit"}
        </button>
      </form>

      {results ? (
        <pre className="mt-6 overflow-x-auto border p-4">
          <code>{JSON.stringify(results, null, 2)}</code>
        </pre>
      ) : null}
    </main>
  );
}
