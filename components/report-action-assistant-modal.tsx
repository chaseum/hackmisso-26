"use client";

import { useState } from "react";
import { MessageSquareText, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { PrioritizationChat } from "@/components/PrioritizationChat";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export function ReportActionAssistantModal({
  assessmentResults,
}: {
  assessmentResults: { [key: string]: JsonValue };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-100 transition-colors hover:bg-white/[0.06]"
      >
        <MessageSquareText className="h-4 w-4 text-cyan-300" />
        AI Action Assistant
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center bg-[#010409]/90 p-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 18 }}
              className="w-full max-w-5xl rounded-[2.5rem] border border-white/10 bg-[#07111d] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.45)]"
            >
              <div className="mb-6 flex items-start justify-between gap-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.26em] text-cyan-200 [font-family:var(--font-mono)]">
                    AI Action Assistant
                  </div>
                  <h2 className="mt-3 text-4xl font-extrabold text-white [font-family:var(--font-display)]">
                    Ask for the next move
                  </h2>
                  <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-300">
                    Open the assistant as a focused action popup instead of keeping it embedded in the report.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Close AI action assistant"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <PrioritizationChat assessmentResults={assessmentResults} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
