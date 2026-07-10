import { Bookmark, FileSearch, ShieldCheck, UploadCloud } from "lucide-react";

const features = [
  {
    icon: UploadCloud,
    title: "Upload in minutes",
    description:
      "Share PDFs, Word documents, presentations, images, or full project ZIPs with rich details so classmates can find them.",
  },
  {
    icon: FileSearch,
    title: "Search that understands courses",
    description:
      "Filter by university, course, semester, subject, and language. Full-text search covers titles, subjects, and descriptions.",
  },
  {
    icon: Bookmark,
    title: "Save for exam week",
    description:
      "Bookmark the material you need and find it again instantly from your dashboard when revision time comes.",
  },
  {
    icon: ShieldCheck,
    title: "Your uploads stay yours",
    description:
      "Files are stored securely and served through protected links. You control what you publish and can remove it anytime.",
  },
];

export function Features() {
  return (
    <section className="container py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Built for how students actually study
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          No clutter, no paywalls in your way — just the material you need,
          organised the way your course is.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <feature.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
