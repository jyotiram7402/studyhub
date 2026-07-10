"use client";

import Link from "next/link";
import { useState } from "react";
import {
  GraduationCap,
  Layers3,
  ListChecks,
  Loader2,
  MessageCircleQuestion,
  Sparkles,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { ChatPanel } from "@/components/ai/chat-panel";
import { QuizViewer } from "@/components/ai/quiz-viewer";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { QuizQuestionRecord } from "@/lib/types";

type Tool = "chat" | "explain" | "quiz" | "flashcards" | "revision";

const TOOLS: { id: Tool; label: string; icon: typeof Sparkles }[] = [
  { id: "chat", label: "Chat with note", icon: MessageCircleQuestion },
  { id: "explain", label: "Explain", icon: GraduationCap },
  { id: "quiz", label: "Quiz", icon: ListChecks },
  { id: "flashcards", label: "Flashcards", icon: Layers3 },
  { id: "revision", label: "Revision", icon: Timer },
];

const EXPLAIN_MODES = [
  { value: "standard", label: "Explain this note" },
  { value: "beginner", label: "Explain like I'm a beginner" },
  { value: "examples", label: "Explain with examples" },
  { value: "simple_english", label: "Explain in simple English" },
];

const REVISION_MODES = [
  { value: "one_minute", label: "1-minute revision" },
  { value: "five_minute", label: "5-minute revision" },
  { value: "exam", label: "Exam revision notes" },
  { value: "night_before", label: "Night-before-exam notes" },
];

const QUIZ_TYPES = [
  { value: "mcq", label: "MCQs" },
  { value: "short_answer", label: "Short questions" },
  { value: "long_answer", label: "Long questions" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the blanks" },
];

export function StudyToolsPanel({ noteId }: { noteId: string }) {
  const [tool, setTool] = useState<Tool>("chat");
  const [loading, setLoading] = useState(false);

  const [explainMode, setExplainMode] = useState("standard");
  const [explanation, setExplanation] = useState("");

  const [revisionMode, setRevisionMode] = useState("one_minute");
  const [revision, setRevision] = useState("");

  const [quizTypes, setQuizTypes] = useState<string[]>(["mcq", "short_answer"]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionRecord[] | null>(null);

  const [flashcardsCreated, setFlashcardsCreated] = useState(0);

  async function callTool(path: string, body: unknown): Promise<Record<string, unknown> | null> {
    setLoading(true);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.error ?? "The AI is unavailable right now. Try again shortly.");
        return null;
      }
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function runExplain() {
    const data = await callTool(`/api/notes/${noteId}/explain`, { mode: explainMode });
    if (data?.explanation) setExplanation(String(data.explanation));
  }

  async function runRevision() {
    const data = await callTool(`/api/notes/${noteId}/revision`, { mode: revisionMode });
    if (data?.revision) setRevision(String(data.revision));
  }

  async function runQuiz() {
    if (quizTypes.length === 0) {
      toast.error("Pick at least one question type.");
      return;
    }
    const data = await callTool(`/api/notes/${noteId}/quiz`, {
      types: quizTypes,
      count: 10,
    });
    if (data?.questions) {
      setQuizQuestions(data.questions as QuizQuestionRecord[]);
      toast.success("Quiz saved to your dashboard");
    }
  }

  async function runFlashcards() {
    const data = await callTool(`/api/notes/${noteId}/flashcards`, { count: 12 });
    if (data?.count) {
      setFlashcardsCreated(Number(data.count));
      toast.success(`${data.count} flashcards added to your deck`);
    }
  }

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">AI study tools</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Answers come only from this document — nothing is invented.
      </p>

      <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTool(item.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tool === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tool === "chat" && (
          <ChatPanel
            noteId={noteId}
            className="h-[420px]"
            placeholder="Ask anything about this note..."
            emptyTitle="Chat with this note"
            emptyDescription="Ask a question and the AI answers using only this document's content."
            suggestions={[
              "Summarize the main topics",
              "What are the most important definitions?",
              "Explain the hardest concept simply",
            ]}
          />
        )}

        {tool === "explain" && (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                value={explainMode}
                onChange={(event) => setExplainMode(event.target.value)}
                className="sm:w-64"
                aria-label="Explanation style"
              >
                {EXPLAIN_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </Select>
              <Button onClick={runExplain} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate explanation
              </Button>
            </div>
            {explanation && (
              <div className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">
                {explanation}
              </div>
            )}
          </div>
        )}

        {tool === "quiz" && (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {QUIZ_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="checkbox"
                    checked={quizTypes.includes(type.value)}
                    onChange={() =>
                      setQuizTypes((current) =>
                        current.includes(type.value)
                          ? current.filter((item) => item !== type.value)
                          : [...current, type.value]
                      )
                    }
                    className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                  />
                  {type.label}
                </label>
              ))}
            </div>
            <Button className="mt-4" onClick={runQuiz} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate quiz
            </Button>
            {quizQuestions && (
              <div className="mt-5">
                <QuizViewer questions={quizQuestions} />
              </div>
            )}
          </div>
        )}

        {tool === "flashcards" && (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Generate a deck of flashcards from this note and practice them anytime from
              your dashboard.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={runFlashcards} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate 12 flashcards
              </Button>
              {flashcardsCreated > 0 && (
                <Button variant="outline" asChild>
                  <Link href="/dashboard/flashcards">Practice your deck</Link>
                </Button>
              )}
            </div>
          </div>
        )}

        {tool === "revision" && (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                value={revisionMode}
                onChange={(event) => setRevisionMode(event.target.value)}
                className="sm:w-64"
                aria-label="Revision mode"
              >
                {REVISION_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </Select>
              <Button onClick={runRevision} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate revision
              </Button>
            </div>
            {revision && (
              <div className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">
                {revision}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
