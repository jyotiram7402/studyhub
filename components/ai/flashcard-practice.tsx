"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Flashcard } from "@/lib/types";

export function FlashcardPractice({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  if (cards.length === 0) return null;

  const card = cards[index];

  function markReviewed(cardId: string) {
    if (reviewed.has(cardId)) return;
    setReviewed((current) => new Set(current).add(cardId));
    fetch(`/api/flashcards/${cardId}/review`, { method: "POST" }).catch(() => {});
  }

  function flip() {
    setFlipped((current) => {
      if (!current) markReviewed(card.id);
      return !current;
    });
  }

  function move(delta: number) {
    setFlipped(false);
    setIndex((current) => (current + delta + cards.length) % cards.length);
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-center text-sm text-muted-foreground">
        Card {index + 1} of {cards.length} · {reviewed.size} reviewed this session
      </p>

      <button
        type="button"
        onClick={flip}
        className={cn(
          "mt-4 flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border p-8 text-center shadow-sm transition-colors",
          flipped ? "border-primary/40 bg-primary/5" : "bg-card hover:bg-muted/30"
        )}
        aria-label={flipped ? "Show question" : "Show answer"}
      >
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {flipped ? "Answer" : "Question"}
        </span>
        <span className="mt-3 whitespace-pre-wrap text-base font-medium leading-relaxed">
          {flipped ? card.answer : card.question}
        </span>
        <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <RotateCw className="h-3.5 w-3.5" />
          Tap to flip
        </span>
      </button>

      <div className="mt-5 flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" onClick={() => move(-1)} aria-label="Previous card">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={flip}>
          {flipped ? "Show question" : "Show answer"}
        </Button>
        <Button variant="outline" size="icon" onClick={() => move(1)} aria-label="Next card">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
