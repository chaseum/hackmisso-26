"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, RotateCcw, ShieldAlert, ShieldCheck, X } from "lucide-react";
import type { AssessmentRecommendation, OrgProfile, QuestionRow } from "@/types/database";

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
  recommendations: AssessmentRecommendation[];
  error?: string;
};

function progressPercent(currentIndex: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round(((currentIndex + 1) / total) * 100);
}

export function QuestionnaireFlow({
  questions,
  initialOrgProfile,
  hasExistingAssessment,
}: {
  questions: QuestionRow[];
  initialOrgProfile: OrgProfile;
  hasExistingAssessment: boolean;
}) {
  const router = useRouter();
  const [orgProfile, setOrgProfile] = useState<OrgProfile>(initialOrgProfile);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>(
    questions.reduce<AnswerMap>((accumulator, question) => {
      accumulator[question.id] = null;
      return accumulator;
    }, {}),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showIntroOverlay, setShowIntroOverlay] = useState(true);
  const [isPending, startTransition] = useTransition();

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value !== null).length,
    [answers],
  );
  const canMoveForward = answers[questions[currentIndex]?.id] !== null;
  const allAnswered = answeredCount === questions.length && questions.length > 0;
  const currentQuestion = questions[currentIndex];
  const progressValue = progressPercent(currentIndex, questions.length);

  function setAnswer(questionId: string, value: boolean) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: value,
    }));
  }

  function resetFlow() {
    setAnswers(
      questions.reduce<AnswerMap>((accumulator, question) => {
        accumulator[question.id] = null;
        return accumulator;
      }, {}),
    );
    setCurrentIndex(0);
    setErrorMessage(null);
  }

  async function handleSubmit() {
    if (!allAnswered || isPending) {
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
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

        const result = (await response.json()) as AssessmentResult;

        if (!response.ok) {
          throw new Error(result.error ?? "Failed to submit assessment.");
        }

        router.push(`/dashboard?assessmentId=${result.assessmentId}`);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to submit assessment.");
      }
    });
  }

  if (!currentQuestion) {
    return (
      <div className="card-glass rounded-[2rem] border border-white/10 p-10 text-center text-slate-400">
        No assessment questions are available.
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showIntroOverlay ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[135] flex items-center justify-center bg-[#010409]/96 p-6 backdrop-blur-md"
          >
            <div className="w-full max-w-5xl rounded-[2.5rem] border border-white/10 bg-[#07111d]/98 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="mx-auto max-w-3xl text-center">
                <div className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-200 [font-family:var(--font-mono)]">
                  Before You Start
                </div>
                <h2 className="mt-4 text-4xl font-extrabold text-white [font-family:var(--font-display)] md:text-5xl">
                  Read these reminders first
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-200">
                  Confirm the guidance below before entering the questionnaire.
                </p>
              </div>

              <div className={`mt-8 grid gap-5 ${hasExistingAssessment ? "md:grid-cols-2" : "grid-cols-1"}`}>
                {hasExistingAssessment ? (
                  <div className="rounded-[1.75rem] border border-amber-400/30 bg-[#20150a]/95 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">Important</div>
                    <p className="mt-3 text-xl font-semibold leading-8 text-white">
                      Retaking this assessment creates a fresh snapshot using your existing organization profile.
                    </p>
                  </div>
                ) : null}

                <div className="rounded-[1.75rem] border border-cyan-400/25 bg-[#071725]/95 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">Quick Rule</div>
                  <p className="mt-3 text-xl font-semibold leading-8 text-white">
                    If you do not know the answer, choose No so the report can flag it for review.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowIntroOverlay(false)}
                  className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-8 py-4 text-sm font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(8,145,178,0.28)] transition-colors hover:bg-cyan-500"
                >
                  Understood
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isPending ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[#010409]/90 p-6 backdrop-blur-md"
          >
            <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-cyan-500/20 bg-[#0d1117]/95 p-10 shadow-[0_0_80px_rgba(6,182,212,0.12)]">
              <div className="absolute inset-0 opacity-40">
                <motion.div
                  className="absolute top-10 left-10 h-28 w-28 rounded-full border border-cyan-400/30"
                  animate={{ x: [0, 40, 0], y: [0, 24, 0], rotate: [0, 90, 180] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute right-12 bottom-12 h-20 w-20 rounded-2xl border border-pink-400/20"
                  animate={{ x: [0, -36, 0], y: [0, -28, 0], rotate: [0, -60, -120] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <div className="relative z-10">
                <div className="mb-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400 [font-family:var(--font-mono)]">
                  <motion.span
                    className="h-2 w-2 rounded-full bg-cyan-400"
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.2, 0.9] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                  Feeding assessment into AI
                </div>

                <h2 className="text-3xl font-extrabold tracking-tight text-white [font-family:var(--font-display)]">
                  Building your security report
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                  Scoring failed controls, retrieving framework context, and generating prioritized mitigation steps.
                </p>
                <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className="h-full rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.45)]"
                    initial={{ width: "18%" }}
                    animate={{ width: ["18%", "54%", "82%", "96%"] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400 [font-family:var(--font-mono)]">
                Assessment Progress
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white [font-family:var(--font-display)]">
                {hasExistingAssessment ? "Retake Assessment" : "Start Assessment"}
              </h1>
              <p className="text-base leading-7 text-slate-200">
                Answer one question at a time and move through the assessment with the side arrows.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetFlow}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300 transition-colors hover:bg-white/5"
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/5 bg-[#08111f]/90 px-6 py-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Assessment Progress</span>
              <span className="text-base font-semibold text-white">Question {currentIndex + 1} of {questions.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(45,212,191,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressValue}%` }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            </div>
          </div>

        </div>

        <section className="relative flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => {
              if (currentIndex === 0) {
                router.push("/dashboard");
                return;
              }

              setCurrentIndex((indexValue) => Math.max(0, indexValue - 1));
            }}
            className={`hidden h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/12 text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.12)] transition-all hover:scale-105 hover:bg-cyan-500/20 lg:inline-flex ${currentIndex > 0 ? "" : "opacity-100"} ${showIntroOverlay ? "pointer-events-none opacity-40" : ""}`}
            aria-label={currentIndex === 0 ? "Exit assessment" : "Previous question"}
          >
            {currentIndex === 0 ? <X className="h-9 w-9" /> : <ChevronLeft className="h-10 w-10" />}
          </button>

          <div className="w-full max-w-5xl overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{
                width: `${questions.length * 100}%`,
                transform: `translateX(-${currentIndex * (100 / questions.length)}%)`,
              }}
            >
              {questions.map((question, index) => {
                const selectedAnswer = answers[question.id];

                return (
                  <article key={question.id} className="flex justify-center px-3" style={{ width: `${100 / questions.length}%` }}>
                    <div className="card-glass w-full max-w-5xl rounded-[2rem] border border-white/10 bg-[#1c2b3f]/95 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.3)] md:p-12">
                      <div className="mx-auto flex min-h-[34rem] max-w-4xl flex-col justify-between">
                        <div className="space-y-8 text-center">
                          <div className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">
                            {question.category}
                          </div>

                          <div className="space-y-3">
                            <h2 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-[4.5rem] [font-family:var(--font-display)]">
                              {question.plain_text_question}
                            </h2>
                          </div>

                          <div className="grid gap-4 pt-4 md:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => setAnswer(question.id, true)}
                              className={`rounded-[1.5rem] border p-8 text-center transition-all ${
                                selectedAnswer === true
                                  ? "border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.12)]"
                                  : "border-white/10 bg-[#0f1d33] hover:border-emerald-400/20"
                              }`}
                            >
                              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-emerald-200">
                                <ShieldCheck className="h-10 w-10" />
                              </div>
                              <div className="text-xl font-extrabold uppercase tracking-[0.22em] text-white">Yes</div>
                              <p className="mt-3 text-base leading-7 text-slate-200">We already do this consistently.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAnswer(question.id, false)}
                              className={`rounded-[1.5rem] border p-8 text-center transition-all ${
                                selectedAnswer === false
                                  ? "border-rose-400/40 bg-rose-500/10 shadow-[0_0_30px_rgba(251,113,133,0.12)]"
                                  : "border-white/10 bg-[#0f1d33] hover:border-rose-400/20"
                              }`}
                            >
                              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-rose-200">
                                <ShieldAlert className="h-10 w-10" />
                              </div>
                              <div className="text-xl font-extrabold uppercase tracking-[0.22em] text-white">No</div>
                              <p className="mt-3 text-base leading-7 text-slate-200">
                                We do not have this yet, or we are not confident it is working.
                              </p>
                            </button>
                          </div>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-8">
                          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                            {selectedAnswer === null ? "Select an answer to continue" : `${answeredCount} of ${questions.length} answered`}
                          </div>

                          {index === questions.length - 1 ? (
                            <button
                              type="button"
                              onClick={handleSubmit}
                              disabled={!allAnswered || isPending}
                              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3.5 text-sm font-extrabold uppercase tracking-[0.18em] text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check className="h-5 w-5" />
                              {isPending ? "Submitting..." : "Generate report"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (currentIndex === questions.length - 1) {
                void handleSubmit();
                return;
              }

              setCurrentIndex((indexValue) => Math.min(questions.length - 1, indexValue + 1));
            }}
            disabled={(currentIndex < questions.length - 1 && !canMoveForward) || (currentIndex === questions.length - 1 && (!allAnswered || isPending))}
            className={`hidden h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/12 text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.12)] transition-all hover:scale-105 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-30 lg:inline-flex ${showIntroOverlay ? "pointer-events-none opacity-40" : ""}`}
            aria-label={currentIndex === questions.length - 1 ? "Generate report" : "Next question"}
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </section>

        <div className={`grid gap-4 rounded-[1.75rem] border border-white/5 bg-white/[0.03] p-5 ${hasExistingAssessment ? "" : "md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"}`}>
          {!hasExistingAssessment ? (
            <div className="space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Organization profile</div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.7fr))]">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold text-white">Organization name</span>
                  <input
                    type="text"
                    value={orgProfile.name}
                    onChange={(event) => setOrgProfile((current) => ({ ...current, name: event.target.value }))}
                    className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-4 py-3 text-sm text-white focus:outline-none"
                    placeholder="Example Foundation"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold text-white">Type</span>
                  <select
                    value={orgProfile.type}
                    onChange={(event) =>
                      setOrgProfile((current) => ({
                        ...current,
                        type: event.target.value as OrgProfile["type"],
                      }))
                    }
                    className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-4 py-3 text-sm text-white focus:outline-none"
                  >
                    <option value="Nonprofit">Nonprofit</option>
                    <option value="Student Organization">Student Organization</option>
                    <option value="Small Business">Small Business</option>
                    <option value="Startup">Startup</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold text-white">Size</span>
                  <select
                    value={orgProfile.size}
                    onChange={(event) =>
                      setOrgProfile((current) => ({
                        ...current,
                        size: event.target.value as OrgProfile["size"],
                      }))
                    }
                    className="input-focus w-full rounded-2xl border border-white/5 bg-[#010409] px-4 py-3 text-sm text-white focus:outline-none"
                  >
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="50+">50+</option>
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.04] p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">How this works</div>
            <p className="text-base leading-7 text-slate-200">
              Choose Yes if this protection already exists. Choose No if you are unsure, missing it, or only partly using it.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </>
  );
}
