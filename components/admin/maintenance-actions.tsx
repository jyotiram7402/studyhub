"use client";

import { useState } from "react";
import { Loader2, ReceiptText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MaintenanceActions() {
  const [pending, setPending] = useState<string | null>(null);

  async function run(task: "cancel_stale_orders" | "cleanup_orphaned_files", label: string) {
    setPending(task);
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Maintenance task failed.");
        return;
      }
      toast.success(`${label}: ${body.affected} affected`);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending !== null}
        onClick={() => run("cancel_stale_orders", "Stale orders cancelled")}
      >
        {pending === "cancel_stale_orders" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ReceiptText className="h-3.5 w-3.5" />
        )}
        Cancel stale orders
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={pending !== null}
        onClick={() => run("cleanup_orphaned_files", "Orphaned files removed")}
      >
        {pending === "cleanup_orphaned_files" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Clean orphaned files
      </Button>
    </div>
  );
}
