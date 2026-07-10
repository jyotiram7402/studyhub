"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Flame, Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const RECENT_KEY = "studyhub.recent-searches";
const MAX_RECENT = 5;

function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const next = [query, ...readRecentSearches().filter((item) => item !== query)].slice(
      0,
      MAX_RECENT
    );
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode) — recent searches simply skip
  }
}

interface SuggestionGroup {
  label: string;
  icon: typeof Search;
  items: string[];
}

export function SearchInput({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDiscovery = useCallback(async () => {
    setRecent(readRecentSearches());
    if (popular.length > 0 || trending.length > 0) return;
    try {
      const response = await fetch("/api/search/popular");
      if (!response.ok) return;
      const data = await response.json();
      setPopular(data.popular ?? []);
      setTrending(data.trending ?? []);
    } catch {
      // discovery lists are optional
    }
  }, [popular.length, trending.length]);

  function handleChange(next: string) {
    setValue(next);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    const query = next.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
        if (!response.ok) return;
        const data = await response.json();
        setSuggestions(data.suggestions ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 200);
  }

  function submit(query: string) {
    const trimmed = query.trim();
    setOpen(false);
    if (!trimmed) {
      router.push("/browse");
      return;
    }
    setValue(trimmed);
    saveRecentSearch(trimmed);
    fetch("/api/search/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: trimmed }),
    }).catch(() => {});
    router.push(`/browse?q=${encodeURIComponent(trimmed)}`);
  }

  const showTyped = value.trim().length >= 2 && suggestions.length > 0;
  const groups: SuggestionGroup[] = showTyped
    ? [{ label: "Suggestions", icon: Search, items: suggestions }]
    : [
        { label: "Recent", icon: Clock, items: recent },
        { label: "Trending", icon: Flame, items: trending },
        { label: "Popular", icon: TrendingUp, items: popular },
      ].filter((group) => group.items.length > 0);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
        role="search"
      >
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder='Try "3rd semester DBMS notes" or "ML viva questions"'
          className="pl-9"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => {
            setOpen(true);
            loadDiscovery();
          }}
          aria-label="Search notes"
          aria-expanded={open}
          autoComplete="off"
        />
      </form>

      {open && groups.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-md border bg-card shadow-md">
          {groups.map((group) => (
            <div key={group.label} className="py-1.5">
              <p className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <group.icon className="h-3 w-3" />
                {group.label}
              </p>
              {group.items.map((item) => (
                <button
                  key={`${group.label}-${item}`}
                  type="button"
                  onClick={() => submit(item)}
                  className="block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
