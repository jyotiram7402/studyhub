"use client";

import { useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizQuestionRecord } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple choice",
  short_answer: "Short answer",
  long_answer: "Long answer",
  true_false: "True / False",
  fill_blank: "Fill in the blank",
};

function McqQuestion({ question }: { question: QuizQuestionRecord }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mt-3 space-y-2">
      {(question.options ?? []).map((option) => {
        const isCorrect = option === question.answer;
        const isSelected = option === selected;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setSelected(option)}
            disabled={selected !== null}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              selected === null && "hover:border-primary/50 hover:bg-muted/40",
              selected !== null && isCorrect && "border-emerald-500 bg-emerald-500/10",
              selected !== null && isSelected && !isCorrect && "border-destructive bg-destructive/10"
            )}
          >
            {option}
            {selected !== null && isCorrect && (
              <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            {selected !== null && isSelected && !isCorrect && (
              <X className="h-4 w-4 shrink-0 text-destructive" />
            )}
          </button>
        );
      })}
      {selected !== null && question.explanation && (
        <p className="text-xs text-muted-foreground">{question.explanation}</p>
      )}
    </div>
  );
}

function RevealQuestion({ question }: { question: QuizQuestionRecord }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="mt-3">
      {revealed ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="font-medium">Answer</p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{question.answer}</p>
          {question.explanation && (
            <p className="mt-2 text-xs text-muted-foreground">{question.explanation}</p>
          )}
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setRevealed(true)}>
          <Eye className="h-3.5 w-3.5" />
          Show answer
        </Button>
      )}
    </div>
  );
}

export function QuizViewer({ questions }: { questions: QuizQuestionRecord[] }) {
  return (
    <ol className="space-y-5">
      {questions.map((question, index) => (
        <li key={index} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium">
              {index + 1}. {question.question}
            </p>
            <Badge variant="secondary" className="shrink-0 font-normal">
              {TYPE_LABELS[question.type] ?? question.type}
            </Badge>
          </div>
          {question.type === "mcq" && (question.options?.length ?? 0) > 0 ? (
            <McqQuestion question={question} />
          ) : (
            <RevealQuestion question={question} />
          )}
        </li>
      ))}
    </ol>
  );
}
