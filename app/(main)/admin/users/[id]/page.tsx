import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, ReceiptText, ShoppingBag } from "lucide-react";
import { UserActions } from "@/components/admin/user-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { VerifiedBadge } from "@/components/notes/verified-badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, getInitials } from "@/lib/utils";
import type { Order, OrderStatus, Profile } from "@/lib/types";

export const metadata: Metadata = {
  title: "User detail",
};

export default async function AdminUserDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  const user = data as Profile | null;
  if (!user) notFound();

  const [uploads, orders, downloads, wallet] = await Promise.all([
    supabase
      .from("notes")
      .select("id, title, price, moderation_status, sales_count, created_at")
      .eq("uploader_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("downloads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id),
    supabase.from("seller_wallet").select("total_earned, total_sales").eq("seller_id", id).maybeSingle(),
  ]);

  const uploadRows = uploads.data ?? [];
  const orderRows = (orders.data ?? []) as Order[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              {user.full_name}
              {user.is_verified && <VerifiedBadge />}
              {user.status === "suspended" && <Badge variant="destructive">Suspended</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">
              @{user.username} · Joined {formatDate(user.created_at)}
              {user.college ? ` · ${user.college}` : ""}
            </p>
          </div>
        </div>
        <UserActions
          userId={user.id}
          username={user.username}
          status={user.status}
          isSelf={user.id === admin?.id}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Uploads" value={uploadRows.length} icon={FileText} />
        <StatCard title="Orders" value={orderRows.length} icon={ReceiptText} />
        <StatCard title="Downloads" value={downloads.count ?? 0} icon={Download} />
        <StatCard title="Sales made" value={wallet.data?.total_sales ?? 0} icon={ShoppingBag} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">Upload history</h2>
          </div>
          {uploadRows.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No uploads.</p>
          ) : (
            <ul className="divide-y">
              {uploadRows.map((note) => (
                <li key={note.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                  <Link
                    href={`/notes/${note.id}`}
                    className="line-clamp-1 font-medium hover:text-primary"
                  >
                    {note.title}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {note.sales_count} sales · {formatDate(note.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">Purchase history</h2>
          </div>
          {orderRows.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No orders.</p>
          ) : (
            <ul className="divide-y">
              {orderRows.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                  <span className="font-mono text-xs">{order.order_number}</span>
                  <span className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status as OrderStatus} />
                    <span className="font-medium">{formatPrice(order.total)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
