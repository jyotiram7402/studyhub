import type { Metadata } from "next";
import Link from "next/link";
import { VerificationActions } from "@/components/admin/verification-actions";
import { VerifiedBadge } from "@/components/notes/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Manage sellers",
};

interface VerificationRow {
  id: string;
  message: string | null;
  created_at: string;
  seller: { id: string; username: string; full_name: string } | null;
}

interface AdminSellerRow {
  seller_id: string;
  balance: number;
  total_earned: number;
  total_sales: number;
  seller: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

export default async function AdminSellersPage() {
  const supabase = await createClient();
  const [{ data }, { data: verificationData }] = await Promise.all([
    supabase
      .from("seller_wallet")
      .select(
        "seller_id, balance, total_earned, total_sales, seller:profiles (username, full_name, avatar_url, is_verified)"
      )
      .order("total_earned", { ascending: false })
      .limit(100),
    supabase
      .from("seller_verification")
      .select("id, message, created_at, seller:profiles (id, username, full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const sellers = (data ?? []) as unknown as AdminSellerRow[];
  const verifications = (verificationData ?? []) as unknown as VerificationRow[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage sellers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verification requests, earnings, and sales across all sellers.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Verification requests ({verifications.length})
        </h2>
        {verifications.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No pending verification requests.
          </p>
        ) : (
          verifications.map((request) => (
            <div key={request.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {request.seller ? (
                      <Link
                        href={`/profile/${request.seller.username}`}
                        className="hover:text-primary"
                      >
                        {request.seller.full_name}{" "}
                        <span className="text-muted-foreground">
                          @{request.seller.username}
                        </span>
                      </Link>
                    ) : (
                      "Unknown seller"
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Requested {formatDate(request.created_at)}
                  </p>
                  {request.message && (
                    <p className="mt-2 text-sm text-muted-foreground">{request.message}</p>
                  )}
                </div>
                <VerificationActions requestId={request.id} />
              </div>
            </div>
          ))
        )}
      </section>

      {sellers.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No sellers with sales yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-4 font-medium">Seller</th>
                <th className="p-4 font-medium">Sales</th>
                <th className="p-4 font-medium">Wallet balance</th>
                <th className="p-4 text-right font-medium">Lifetime earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sellers.map((row) => (
                <tr key={row.seller_id}>
                  <td className="p-4">
                    {row.seller ? (
                      <Link
                        href={`/profile/${row.seller.username}`}
                        className="flex items-center gap-3 hover:text-primary"
                      >
                        <Avatar className="h-8 w-8">
                          {row.seller.avatar_url && (
                            <AvatarImage
                              src={row.seller.avatar_url}
                              alt={row.seller.full_name}
                            />
                          )}
                          <AvatarFallback className="text-xs">
                            {getInitials(row.seller.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          <span className="flex items-center gap-1 font-medium">
                            {row.seller.full_name}
                            {row.seller.is_verified && <VerifiedBadge />}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            @{row.seller.username}
                          </span>
                        </span>
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4">{row.total_sales}</td>
                  <td className="p-4">{formatPrice(row.balance)}</td>
                  <td className="p-4 text-right font-medium">
                    {formatPrice(row.total_earned)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
