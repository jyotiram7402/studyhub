import type { Metadata } from "next";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Subjects & courses",
};

export default async function AdminSubjectsPage() {
  const supabase = await createClient();
  const [{ data: subjects }, { data: courses }] = await Promise.all([
    supabase.from("subjects").select("id, name").order("name"),
    supabase.from("courses").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subjects & courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The academic taxonomy behind search and filters — courses cover education
          levels from Class 11 to postgraduate and exam streams.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-semibold">Subjects</h2>
        <TaxonomyManager table="subjects" items={subjects ?? []} itemLabel="Subject" />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Courses & education levels</h2>
        <TaxonomyManager table="courses" items={courses ?? []} itemLabel="Course" />
      </section>
    </div>
  );
}
