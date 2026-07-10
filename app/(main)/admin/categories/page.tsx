import type { Metadata } from "next";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("tags").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories & tags</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The content types and tags sellers can attach to their uploads.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-semibold">Categories</h2>
        <TaxonomyManager table="categories" items={categories ?? []} itemLabel="Category" />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Tags</h2>
        <TaxonomyManager table="tags" items={tags ?? []} itemLabel="Tag" />
      </section>
    </div>
  );
}
