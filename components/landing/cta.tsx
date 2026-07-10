import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="container py-20 md:py-24">
      <div className="relative overflow-hidden rounded-2xl border bg-primary px-6 py-16 text-center text-primary-foreground shadow-lg sm:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.15),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Your notes could be exactly what someone is searching for
          </h2>
          <p className="mt-4 text-balance text-lg text-primary-foreground/80">
            Join StudyHub, upload your first notes in minutes, and help students
            everywhere study smarter.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              asChild
            >
              <Link href="/browse">Browse without an account</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
