"use client";

import { useEffect, useRef } from "react";

export function ViewTracker({ noteId }: { noteId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    fetch(`/api/notes/${noteId}/view`, { method: "POST" }).catch(() => {});
  }, [noteId]);

  return null;
}
