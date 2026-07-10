import type { Metadata } from "next";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Universities & boards",
};

export default async function AdminUniversitiesPage() {
  const supabase = await createClient();
  const { data: universities } = await supabase
    .from("universities")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Universities & boards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Universities, school boards, and institutions sellers can attach their uploads
          to. Deleting one fails while notes still reference it.
        </p>
      </div>
      <TaxonomyManager table="universities" items={universities ?? []} itemLabel="University" />
    </div>
  );
}
