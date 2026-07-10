import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSearch } from "@/components/admin/admin-search";
import { ListingTable } from "@/components/admin/listing-table";

export const metadata: Metadata = {
  title: "Manage projects",
};

export default async function AdminProjectsPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mini and major project listings across the marketplace.
          </p>
        </div>
        <Suspense>
          <AdminSearch placeholder="Search projects by title..." />
        </Suspense>
      </div>
      <ListingTable query={q} projectsOnly />
    </div>
  );
}
