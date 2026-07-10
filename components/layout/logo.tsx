import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <BookOpenText className="h-4 w-4" />
      </span>
      <span className="text-lg">{SITE_NAME}</span>
    </Link>
  );
}
