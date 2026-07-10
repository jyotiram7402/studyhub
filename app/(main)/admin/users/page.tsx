import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSearch } from "@/components/admin/admin-search";
import { UserActions } from "@/components/admin/user-actions";
import { VerifiedBadge } from "@/components/notes/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, getInitials } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = {
  title: "Manage users",
};

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  let request = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    const term = q.replace(/[,()%]/g, "");
    request = request.or(`username.ilike.%${term}%,full_name.ilike.%${term}%`);
  }

  const { data } = await request;
  const users = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length} {users.length === 1 ? "account" : "accounts"}
            {q ? ` matching “${q}”` : ""}
          </p>
        </div>
        <Suspense>
          <AdminSearch placeholder="Search by name or username..." />
        </Suspense>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <Link href={`/admin/users/${user.id}`} className="flex min-w-0 items-center gap-3">
              <Avatar className="h-9 w-9">
                {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
                <AvatarFallback className="text-xs">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium hover:text-primary">
                  {user.full_name}
                  {user.is_verified && <VerifiedBadge />}
                  {user.role === "admin" && <Badge variant="outline">Admin</Badge>}
                  {user.status === "suspended" && (
                    <Badge variant="destructive">Suspended</Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{user.username} · Joined {formatDate(user.created_at)}
                </p>
              </div>
            </Link>
            <UserActions
              userId={user.id}
              username={user.username}
              status={user.status}
              isSelf={user.id === admin?.id}
            />
          </div>
        ))}
        {users.length === 0 && (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No users match your search.
          </p>
        )}
      </div>
    </div>
  );
}
