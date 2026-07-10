"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface UserActionsProps {
  userId: string;
  username: string;
  status: "active" | "suspended";
  isSelf: boolean;
}

export function UserActions({ userId, username, status, isSelf }: UserActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function toggleStatus() {
    const action = status === "active" ? "suspend" : "activate";
    setPending(action);
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPending(null);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Could not update user.");
      return;
    }

    toast.success(action === "suspend" ? `@${username} suspended` : `@${username} activated`);
    router.refresh();
  }

  async function deleteUser() {
    const confirmed = window.confirm(
      `Permanently delete @${username}? This removes their account, uploads, purchases, and reviews. This cannot be undone.`
    );
    if (!confirmed) return;

    setPending("delete");
    const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setPending(null);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Could not delete user.");
      return;
    }

    toast.success(`@${username} deleted`);
    router.refresh();
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">This is you</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleStatus}
        disabled={pending !== null}
      >
        {pending === "suspend" || pending === "activate" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : status === "active" ? (
          <UserX className="h-3.5 w-3.5" />
        ) : (
          <UserCheck className="h-3.5 w-3.5" />
        )}
        {status === "active" ? "Suspend" : "Activate"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={deleteUser}
        disabled={pending !== null}
      >
        {pending === "delete" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Delete
      </Button>
    </div>
  );
}
