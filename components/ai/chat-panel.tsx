"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizonal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ChatPanelMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  noteId?: string;
  initialSessionId?: string;
  initialMessages?: ChatPanelMessage[];
  placeholder: string;
  suggestions?: string[];
  emptyTitle: string;
  emptyDescription: string;
  className?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export function ChatPanel({
  noteId,
  initialSessionId,
  initialMessages,
  placeholder,
  suggestions,
  emptyTitle,
  emptyDescription,
  className,
  onSessionCreated,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatPanelMessage[]>(initialMessages ?? []);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    setMessages((current) => [...current, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, sessionId, noteId }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(body?.error ?? "The assistant is unavailable right now.");
        setMessages((current) => current.slice(0, -1));
        return;
      }

      if (!sessionId && body.sessionId) {
        setSessionId(body.sessionId);
        onSessionCreated?.(body.sessionId);
      }
      setMessages((current) => [...current, { role: "assistant", content: body.answer }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col rounded-xl border bg-card shadow-sm", className)}>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !loading ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium">{emptyTitle}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
            {suggestions && suggestions.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t p-3"
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={placeholder}
          aria-label="Message"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send">
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
