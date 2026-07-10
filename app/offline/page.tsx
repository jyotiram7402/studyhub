import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-7 w-7 text-muted-foreground" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">You&apos;re offline</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        StudyHub needs a connection to load notes and your library. Check your
        internet and try again.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">Try again</Link>
      </Button>
    </div>
  );
}
