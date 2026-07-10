"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [contentAction, setContentAction] = useState("none");
  const [pending, setPending] = useState<string | null>(null);

  async function review(action: "resolve" | "dismiss") {
    setPending(action);
    const response = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, contentAction }),
    });
    setPending(null);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Could not update report.");
      return;
    }

    toast.success(action === "resolve" ? "Report resolved" : "Report dismissed");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={contentAction}
        onChange={(event) => setContentAction(event.target.value)}
        className="h-8 sm:w-48"
        aria-label="Action on reported content"
      >
        <option value="none">No content action</option>
        <option value="hide">Hide the listing</option>
        <option value="remove">Remove the listing</option>
      </Select>
      <div className="flex gap-1.5">
        <Button size="sm" onClick={() => review("resolve")} disabled={pending !== null}>
          {pending === "resolve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Resolve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => review("dismiss")}
          disabled={pending !== null}
        >
          {pending === "dismiss" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Dismiss
        </Button>
      </div>
    </div>
  );
}
