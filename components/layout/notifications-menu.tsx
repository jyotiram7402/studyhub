"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, timeAgo } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

interface NotificationsMenuProps {
  notifications: AppNotification[];
  unreadCount: number;
}

export function NotificationsMenu({ notifications, unreadCount }: NotificationsMenuProps) {
  const router = useRouter();
  const [badgeCount, setBadgeCount] = useState(unreadCount);

  async function handleOpenChange(open: boolean) {
    if (open && badgeCount > 0) {
      setBadgeCount(0);
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      router.refresh();
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {badgeCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/notifications"
                className="justify-center text-xs font-medium text-primary"
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {notifications.length > 0 &&
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} asChild>
              <Link
                href={notification.link ?? "/dashboard"}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span
                  className={cn(
                    "text-sm leading-snug",
                    !notification.read_at && "font-semibold"
                  )}
                >
                  {notification.title}
                </span>
                {notification.body && (
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {notification.body}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {timeAgo(notification.created_at)}
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
