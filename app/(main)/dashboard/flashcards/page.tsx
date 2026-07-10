import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers3 } from "lucide-react";
import { FlashcardPractice } from "@/components/ai/flashcard-practice";
import { EmptyState } from "@/components/notes/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Flashcard } from "@/lib/types";

export const metadata: Metadata = {
  title: "Flashcards",
};

type FlashcardRow = Flashcard & { note: { id: string; title: string } | null };

export default async function FlashcardsPage(props: {
  searchParams: Promise<{ note?: string }>;
}) {
  const { note: noteFilter } = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/flashcards");

  const { data } = await supabase
    .from("flashcards")
    .select("*, note:notes (id, title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const cards = (data ?? []) as unknown as FlashcardRow[];

  const decks = new Map<string, { title: string; cards: FlashcardRow[] }>();
  for (const card of cards) {
    const key = card.note?.id ?? "general";
    const deck = decks.get(key) ?? {
      title: card.note?.title ?? "General flashcards",
      cards: [],
    };
    deck.cards.push(card);
    decks.set(key, deck);
  }

  const activeDeckKey = noteFilter && decks.has(noteFilter) ? noteFilter : null;
  const activeDeck = activeDeckKey ? decks.get(activeDeckKey)! : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Flashcards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {cards.length} {cards.length === 1 ? "card" : "cards"} across {decks.size}{" "}
          {decks.size === 1 ? "deck" : "decks"}. Flipping a card counts as a review.
        </p>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={Layers3}
          title="No flashcards yet"
          description="Open any note you own or purchased and use the AI study tools to generate a flashcard deck."
          actionLabel="Go to my library"
          actionHref="/dashboard/library"
        />
      ) : activeDeck ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{activeDeck.title}</h2>
            <Link
              href="/dashboard/flashcards"
              className="text-sm text-primary hover:underline"
            >
              All decks
            </Link>
          </div>
          <FlashcardPractice cards={activeDeck.cards} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(decks.entries()).map(([key, deck]) => (
            <Link
              key={key}
              href={`/dashboard/flashcards?note=${key}`}
              className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers3 className="h-4 w-4" />
              </span>
              <p className="mt-3 line-clamp-2 text-sm font-medium group-hover:text-primary">
                {deck.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"} ·{" "}
                {deck.cards.reduce((sum, card) => sum + card.review_count, 0)} reviews
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
