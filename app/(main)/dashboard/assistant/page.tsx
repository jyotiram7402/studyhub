import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChatPanel } from "@/components/ai/chat-panel";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/gemini";
import { EmptyState } from "@/components/notes/empty-state";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI study assistant",
};

export default async function AssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/assistant");

  if (!isAiConfigured()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI study assistant</h1>
        </div>
        <EmptyState
          icon={Sparkles}
          title="AI features are not enabled"
          description="Add a GEMINI_API_KEY to the deployment environment to switch on the study assistant, semantic search, and AI summaries."
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[480px] flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI study assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask anything — the assistant answers from the notes you own or purchased, and
          tells you when your library doesn&apos;t cover a topic.
        </p>
      </div>

      <ChatPanel
        className="flex-1"
        placeholder="e.g. Summarize unit 3 of my DBMS notes"
        emptyTitle="Your personal study assistant"
        emptyDescription="It reads across everything in your library and answers with sources."
        suggestions={[
          "Summarize the key topics in my library",
          "Explain DBMS normalization from my notes",
          "Generate likely viva questions from my notes",
          "What should I revise first for exams?",
        ]}
      />
    </div>
  );
}
