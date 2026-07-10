import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { getCurrentProfile } from "@/lib/queries/profiles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?redirect=/admin");
  }
  if (profile.role !== "admin") {
    notFound();
  }

  return (
    <div className="container py-8 md:py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        Admin console
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <AdminNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
