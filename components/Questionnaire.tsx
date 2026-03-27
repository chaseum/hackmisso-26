"use client";

import { useEffect, useState } from "react";
import type { QuestionRow } from "@/types/database";

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

export function Questionnaire() {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadQuestions() {
      setIsLoadingQuestions(true);
      setError(null);

      try {
        const response = await fetch("/api/assessment", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const payload = (await response.json()) as { questions?: QuestionRow[]; error?: string };
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
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load questions.");
      } finally {
        if (isMounted) {
          setIsLoadingQuestions(false);
        }
      }
    }

    void loadQuestions();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateAnswer(questionId: string, userAnsweredYes: boolean) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: userAnsweredYes,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const unansweredQuestion = questions.find((question) => answers[question.id] === null);
    if (unansweredQuestion) {
      setError("Please answer every question before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionPayload = questions.map((question) => ({
        questionId: question.id,
        userAnsweredYes: Boolean(answers[question.id]),
      }));

      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionPayload),
      });

      const payload = (await response.json()) as AssessmentResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Assessment submission failed.");
      }

      setResult(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Assessment submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingQuestions) {
    return <div>Loading questions...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? <p>{error}</p> : null}

      {questions.map((question) => (
        <fieldset key={question.id}>
          <legend>{question.plain_text_question}</legend>
          <label>
            <input
              type="radio"
              name={question.id}
              checked={answers[question.id] === true}
              onChange={() => updateAnswer(question.id, true)}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name={question.id}
              checked={answers[question.id] === false}
              onChange={() => updateAnswer(question.id, false)}
            />
            No
          </label>
        </fieldset>
      ))}

      <button type="submit" disabled={isSubmitting || questions.length === 0}>
        {isSubmitting ? "Analyzing Risk Posture..." : "Submit Assessment"}
      </button>

      {result ? (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      ) : null}
    </form>
  );
}
