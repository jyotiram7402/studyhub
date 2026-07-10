import Link from "next/link";
import { ArrowRight, FileText, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { icon: FileText, label: "Notes & papers", value: "For every course" },
  { icon: GraduationCap, label: "Streams covered", value: "School to PhD" },
  { icon: Users, label: "Community", value: "Students worldwide" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]"
      />
      <div className="container relative py-20 md:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="animate-fade-up inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            The student marketplace — sell your notes, keep your earnings
          </p>
          <h1 className="animate-fade-up mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl [animation-delay:75ms]">
            Every note you need,
            <span className="text-primary"> shared by students like you</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground [animation-delay:150ms]">
            Handwritten notes, question papers, assignments, lab manuals, and
            projects — from Class 11 to engineering, medical, MBA, and
            government exams. Upload yours, discover thousands more.
          </p>
          <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:225ms]">
            <Button size="lg" asChild>
              <Link href="/browse">
                Explore notes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Start contributing</Link>
            </Button>
          </div>
        </div>

        <div className="animate-fade-up mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3 [animation-delay:300ms]">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
