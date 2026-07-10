"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerificationActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function review(action: "approve" | "reject") {
    setPending(action);
    const response = await fetch(`/api/admin/verifications/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNote: note }),
    });
    setPending(null);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Could not update request.");
      return;
    }

    toast.success(action === "approve" ? "Seller verified" : "Request rejected");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Review note (optional)"
        className="h-8 sm:w-56"
      />
      <div className="flex gap-1.5">
        <Button size="sm" onClick={() => review("approve")} disabled={pending !== null}>
          {pending === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BadgeCheck className="h-3.5 w-3.5" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => review("reject")}
          disabled={pending !== null}
        >
          {pending === "reject" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Reject
        </Button>
      </div>
    </div>
  );
}
