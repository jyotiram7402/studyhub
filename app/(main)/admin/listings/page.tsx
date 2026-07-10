import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSearch } from "@/components/admin/admin-search";
import { ListingTable } from "@/components/admin/listing-table";

export const metadata: Metadata = {
  title: "Manage notes",
};

export default async function AdminListingsPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve, hide, remove, restore, and feature marketplace listings.
          </p>
        </div>
        <Suspense>
          <AdminSearch placeholder="Search listings by title..." />
        </Suspense>
      </div>
      <ListingTable query={q} />
    </div>
  );
}
