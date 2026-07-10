import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const subjects = [
  "Data Structures",
  "Operating Systems",
  "Database Management Systems",
  "Machine Learning",
  "Engineering Mechanics",
  "Thermodynamics",
  "Digital Electronics",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Accountancy",
  "Economics",
  "Anatomy",
  "Pharmacology",
  "Indian Polity",
  "General Studies",
];

export function PopularSubjects() {
  return (
    <section className="container py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Popular subjects</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Jump straight into the subjects students search for the most.
        </p>
      </div>
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
        {subjects.map((subject) => (
          <Link key={subject} href={`/browse?q=${encodeURIComponent(subject)}`}>
            <Badge
              variant="secondary"
              className="cursor-pointer px-3.5 py-1.5 text-sm font-normal transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {subject}
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}
