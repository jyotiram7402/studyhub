"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bookmark,
  FileText,
  Layers3,
  LayoutDashboard,
  Library,
  ListChecks,
  ReceiptText,
  Settings,
  Sparkles,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/assistant", label: "AI assistant", icon: Sparkles },
  { href: "/dashboard/library", label: "My library", icon: Library },
  { href: "/dashboard/flashcards", label: "Flashcards", icon: Layers3 },
  { href: "/dashboard/quizzes", label: "Quizzes", icon: ListChecks },
  { href: "/dashboard/orders", label: "Orders", icon: ReceiptText },
  { href: "/dashboard/uploads", label: "My uploads", icon: FileText },
  { href: "/dashboard/seller", label: "Selling", icon: Store },
  { href: "/dashboard/bookmarks", label: "Wishlist", icon: Bookmark },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
      {navItems.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
