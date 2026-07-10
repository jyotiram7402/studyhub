import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/notes/empty-state";
import { createClient } from "@/lib/supabase/server";
import { cn, timeAgo } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/notifications");

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const notifications = (data ?? []) as AppNotification[];
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} unread — opening the bell marks everything read.`
            : "You're all caught up."}
        </p>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Purchases, sales, reviews, moderation decisions, and report outcomes show up here."
          actionLabel="Browse notes"
          actionHref="/browse"
        />
      ) : (
        <ul className="divide-y rounded-xl border bg-card shadow-sm">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Link
                href={notification.link ?? "/dashboard"}
                className="flex items-start gap-3 p-4 transition-colors hover:bg-accent/50"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    notification.read_at ? "bg-transparent" : "bg-primary"
                  )}
                />
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      !notification.read_at && "font-semibold"
                    )}
                  >
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {timeAgo(notification.created_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
