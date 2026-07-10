import { TriangleAlert } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("maintenance_mode")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {settings?.maintenance_mode && (
        <div className="border-b bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
          <div className="container flex items-center gap-2 py-2 text-sm">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            StudyHub is in maintenance mode — uploads and checkout may be briefly
            unavailable.
          </div>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
