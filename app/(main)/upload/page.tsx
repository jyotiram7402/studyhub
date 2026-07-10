import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UploadForm } from "@/components/notes/upload-form";
import { getFilterOptions } from "@/lib/queries/notes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Upload notes",
};

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/upload");
  }

  const options = await getFilterOptions();

  return (
    <div className="container max-w-3xl py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Upload notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your study material with students everywhere. Good details make it
          easier to find.
        </p>
      </div>
      <UploadForm
        userId={user.id}
        categories={options.categories}
        universities={options.universities}
        courses={options.courses}
        subjects={options.subjects}
      />
    </div>
  );
}
