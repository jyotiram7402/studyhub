"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlert className="h-7 w-7 text-destructive" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while loading this page. It has been logged —
        trying again usually fixes it.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
      )}
      <Button className="mt-8" onClick={reset}>
        <RotateCcw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
