"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  noteId: string;
  isSignedIn: boolean;
}

export function DownloadButton({ noteId, isSignedIn }: DownloadButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!isSignedIn) {
      router.push(`/login?redirect=/notes/${noteId}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/download`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "Download failed. Please try again.");
        return;
      }

      const { url } = await response.json();
      window.location.assign(url);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Download
    </Button>
  );
}
