"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  FileCheck,
  FolderKanban,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Flag,
  Star,
  Tags,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/sellers", label: "Sellers", icon: GraduationCap },
  { href: "/admin/listings", label: "Notes", icon: FileCheck },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/subjects", label: "Subjects", icon: Layers },
  { href: "/admin/universities", label: "Universities", icon: GraduationCap },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/system", label: "System", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
      {navItems.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
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
