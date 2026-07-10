import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";
import { QuizViewer } from "@/components/ai/quiz-viewer";
import { EmptyState } from "@/components/notes/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Quiz } from "@/lib/types";

export const metadata: Metadata = {
  title: "Quizzes",
};

export default async function QuizzesPage(props: {
  searchParams: Promise<{ quiz?: string }>;
}) {
  const { quiz: quizId } = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/quizzes");

  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const quizzes = (data ?? []) as Quiz[];
  const activeQuiz = quizId ? quizzes.find((quiz) => quiz.id === quizId) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quizzes you generate from notes are saved here to practice again.
        </p>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No quizzes yet"
          description="Open any note you own or purchased and generate a quiz with the AI study tools."
          actionLabel="Go to my library"
          actionHref="/dashboard/library"
        />
      ) : activeQuiz ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{activeQuiz.title}</h2>
            <Link href="/dashboard/quizzes" className="text-sm text-primary hover:underline">
              All quizzes
            </Link>
          </div>
          <QuizViewer questions={activeQuiz.questions} />
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/dashboard/quizzes?quiz=${quiz.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-medium">{quiz.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {quiz.questions.length} questions · {formatDate(quiz.created_at)}
                </p>
              </div>
              <ListChecks className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
